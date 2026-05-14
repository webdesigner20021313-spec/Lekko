import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { type AxiosRequestConfig } from 'axios'
import { api, pickApiError } from './client'

// Запросы идут через `api` (см. actualCall) — там настроены paramsSerializer
// (массивы как `?ids=1&ids=2`) и interceptors. Голый `axios` используется только
// для `isAxiosError` helper'а в catch-блоке.

// ────────────────────────────────────────────────────────────────────────────
// Module-level дедуп идентичных запросов в полёте.
// Решает несколько кейсов:
//  - React StrictMode (dev) фаерит useEffect дважды → 2 параллельных fetch'а
//    одного эндпоинта. С дедупом — один HTTP, оба consumer'а получают результат.
//  - Несколько компонентов подписаны на ту же выдачу (например /api/auth/me
//    из 2 мест на странице). С дедупом — один HTTP.
// Ключ: method + baseURL + url + params + body. После resolve/reject — удаляем
// запись из карты, чтобы следующий запрос шёл свежим.
// ────────────────────────────────────────────────────────────────────────────
const inFlightRequests = new Map<string, Promise<unknown>>()

// TTL-кеш для opt-in хуков (`staleTimeMs > 0`). Хранит resolved data по тому же
// ключу. Если consumer запрашивает повторно в пределах TTL — отдаём cached
// результат без HTTP. refetch() игнорирует cache (forceFresh).
//
// Cap: 200 записей; при overflow выкидываем самую старую (Map сохраняет insertion order).
const CACHE_CAP = 200
const resolvedCache = new Map<string, { data: unknown; ts: number }>()

function setCache(key: string, data: unknown) {
  if (resolvedCache.size >= CACHE_CAP) {
    const firstKey = resolvedCache.keys().next().value
    if (firstKey !== undefined) resolvedCache.delete(firstKey)
  }
  resolvedCache.set(key, { data, ts: Date.now() })
}

function getCache(key: string, ttlMs: number): unknown | undefined {
  const entry = resolvedCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.ts > ttlMs) {
    resolvedCache.delete(key)
    return undefined
  }
  return entry.data
}

function requestKey(config: AxiosRequestConfig): string {
  return [
    config.method ?? 'GET',
    config.baseURL ?? '',
    config.url ?? '',
    config.params ? JSON.stringify(config.params) : '',
    config.data !== undefined ? JSON.stringify(config.data) : '',
  ].join('|')
}

/**
 * Универсальный API-хук — один на всё (GET, POST, PUT, DELETE).
 * Возвращает: data, isLoading, isSuccess, isError, refetch, appendData.
 *
 *  - GET — стартует автоматически на mount (если не disableOnMount).
 *  - не-GET — disableOnMount: true, триггер вручную через appendData(body, urlParams).
 *  - urlParams: подставляет `:key` в url (например `:id` → `/cart/items/42`).
 *  - cookies HttpOnly летят сами (`api.defaults.withCredentials=true`).
 */

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestProps {
  url: string
  method?: RequestMethod
  data?: unknown
  params?: Record<string, unknown>
  baseUrl?: string
  headers?: Record<string, string>
  disableOnMount?: boolean
  enableOnMount?: boolean
  multipart?: boolean
  /**
   * TTL-кеш для повторных вызовов в пределах N миллисекунд. 0 = без кеша (default).
   * Используется когда переключение туда-обратно не должно дёргать бэкенд:
   *   useOffersByDrugId — staleTimeMs: 60_000
   *   useOrderStatuses  — staleTimeMs: 5 * 60_000 (справочник, редко меняется)
   * refetch() всегда форсит fresh.
   */
  staleTimeMs?: number
}

export interface UseQueryApiClientProps {
  request: RequestProps
  onSuccess?: (data: unknown, passOnSuccess?: unknown) => void
  onError?: (error: unknown) => void
  onFinally?: () => void
  enabled?: boolean
}

export function useQueryApiClient<T = unknown>({
  request,
  onSuccess,
  onError,
  onFinally,
  enabled = true,
}: UseQueryApiClientProps) {
  const method: RequestMethod = request.method ?? 'GET'

  const [data, setData] = useState<T>(([] as unknown) as T)
  const [isLoading, setIsLoading] = useState<boolean>(
    enabled ? method === 'GET' && !request.disableOnMount : false,
  )
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const navigate = useNavigate()

  // Игнорируем ответы устаревших запросов (без AbortController, чтобы в Network не было canceled).
  const versionRef = useRef(0)

  const { url, method: m, baseUrl, multipart, disableOnMount, enableOnMount } = request
  // Стабильные ключи: иначе каждый рендер создаёт новый объект → useEffect фаерит.
  const paramsKey = request.params ? JSON.stringify(request.params) : ''
  // dataKey нужен для POST-поисков (тип useDrugSearch), где фильтры лежат в body, не в query.
  // Без него смена data.favoritesOnly/drugName/... не триггерит refetch.
  const dataKey = request.data !== undefined ? JSON.stringify(request.data) : ''
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = (() => request.params)()

  // Авто-старт для GET. Не-GET ждёт явного appendData.
  useEffect(() => {
    if (!enabled) return
    if (disableOnMount) return
    if (enableOnMount || method === 'GET') {
      void actualCall(url, request.data, m, multipart, undefined, baseUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, disableOnMount, enableOnMount, url, m, multipart, baseUrl, paramsKey, dataKey])

  function refetch() {
    setIsRefetching(true)
    // forceFresh=true — игнорируем resolvedCache, всегда новый HTTP.
    void actualCall(url, request.data, method, multipart, undefined, baseUrl, true)
  }

  /**
   * Запустить запрос вручную (для не-GET и параметризованных GET).
   *  - body|params: для не-GET → body; для GET → query string (если в request.params не задан).
   *  - urlParams: подставляет `:key` в url.
   */
  function appendData(body?: unknown, urlParams?: Record<string, string | number>, passOnSuccess?: unknown) {
    let finalUrl = url
    if (urlParams) {
      Object.entries(urlParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`:${key}`, String(value))
      })
    }
    void actualCall(finalUrl, body, method, multipart, passOnSuccess, baseUrl)
  }

  async function actualCall(
    callUrl: string,
    body: unknown = {},
    callMethod: RequestMethod = 'GET',
    isMultipart: boolean = false,
    passOnSuccess: unknown = undefined,
    callBaseUrl?: string,
    forceFresh: boolean = false,
  ) {
    if (!enabled) return

    const myVersion = ++versionRef.current
    setIsLoading(true)

    const config: AxiosRequestConfig = {
      url: callUrl,
      method: callMethod,
      baseURL: callBaseUrl || api.defaults.baseURL,
      withCredentials: true,
      responseType: isMultipart ? 'blob' : 'json',
      headers: {
        'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
        'X-Frontend-Route': typeof window !== 'undefined' ? window.location.pathname : '',
        ...(request.headers ?? {}),
      },
    }

    if (callMethod === 'GET') {
      config.params = stableParams ?? body
    } else {
      config.data = body
      // params в не-GET (например ?page=N в POST поиске) тоже отправляем.
      if (stableParams) config.params = stableParams
    }

    const key = requestKey(config)
    const staleTime = request.staleTimeMs ?? 0

    // TTL-cache hit (только GET, opt-in через staleTimeMs > 0, не forceFresh).
    if (!forceFresh && callMethod === 'GET' && staleTime > 0) {
      const cached = getCache(key, staleTime)
      if (cached !== undefined) {
        if (myVersion !== versionRef.current) return
        setData(cached as T)
        setIsSuccess(true)
        setIsLoading(false)
        setIsRefetching(false)
        onSuccess?.(cached, passOnSuccess)
        onFinally?.()
        return cached
      }
    }

    try {
      // ВАЖНО: через `api`, не `axios` — иначе теряется paramsSerializer
      // (массивы как `?ids=1&ids=2`, ASP.NET формат) и interceptors.
      // Дедуп: если идентичный запрос уже в полёте — ждём его результат
      // (общий promise), не делаем второй HTTP.
      let promise = inFlightRequests.get(key) as Promise<unknown> | undefined
      if (!promise) {
        promise = api.request(config).then((r) => r.data)
        inFlightRequests.set(key, promise)
        // Чистим после resolve/reject, чтобы следующий запрос шёл свежим.
        promise.finally(() => {
          if (inFlightRequests.get(key) === promise) inFlightRequests.delete(key)
        }).catch(() => { /* swallow — handled below */ })
      }
      const data = await promise
      if (myVersion !== versionRef.current) return // устарел — не трогаем state

      // Сохраняем в TTL-cache (только GET, staleTime > 0).
      if (callMethod === 'GET' && staleTime > 0) setCache(key, data)

      setData(data as T)
      setIsSuccess(true)
      onSuccess?.(data, passOnSuccess)
      return data
    } catch (e: unknown) {
      if (myVersion !== versionRef.current) return

      const status = axios.isAxiosError(e) ? e.response?.status : undefined
      console.error(e)

      if (status === 401) navigate('/login', { replace: true })

      setIsError(true)
      onError?.(pickApiError(e))
    } finally {
      if (myVersion === versionRef.current) {
        setIsRefetching(false)
        setIsLoading(false)
      }
      onFinally?.()
    }
  }

  return { data, isLoading, isSuccess, isError, isRefetching, refetch, appendData }
}

export default useQueryApiClient
