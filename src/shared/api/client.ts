import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8080'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  // ASP.NET Core model binder для `[FromQuery] long[]` ждёт повторяющийся ключ
  // (`?ids=1&ids=2`), а не формат brackets (`?ids[]=1&ids[]=2`). Axios по
  // дефолту делает brackets — переопределяем.
  paramsSerializer: {
    serialize: (params) => {
      const search = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v === undefined || v === null) return
            search.append(key, String(v))
          })
        } else {
          search.append(key, String(value))
        }
      })
      return search.toString()
    },
  },
})

// Service-side metadata for diagnostics. Не критично, но удобно в логах бэка.
api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  cfg.headers ??= {} as InternalAxiosRequestConfig['headers']
  if (typeof window !== 'undefined') {
    cfg.headers.set?.('X-Frontend-Route', window.location.pathname) ??
      ((cfg.headers as Record<string, string>)['X-Frontend-Route'] =
        window.location.pathname)
  }
  return cfg
})

// 401 → пробуем refresh-token; если он валиден — повторяем запрос. Если refresh
// тоже 401 (вылет с устройства через /sessions/revoke или истёкший refresh) —
// редирект на /login.
const PUBLIC_PATHS = ['/login', '/distributor-portal']
const SILENT_API = ['/api/auth/me', '/api/auth/login', '/api/auth/refresh-token']

// Один in-flight refresh на все параллельные 401-запросы — иначе при первом 401
// несколько API вызвали бы refresh одновременно и refresh-токен консьюмился N раз.
let refreshInFlight: Promise<boolean> | null = null
async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        await api.post('/api/auth/refresh-token', {})
        return true
      } catch {
        return false
      } finally {
        // Очищаем после завершения, чтобы следующий 401 не получил кешированный fail.
        setTimeout(() => { refreshInFlight = null }, 100)
      }
    })()
  }
  return refreshInFlight
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const cfg = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (typeof window === 'undefined') return Promise.reject(error)
    if (PUBLIC_PATHS.includes(window.location.pathname)) return Promise.reject(error)
    if (status !== 401) return Promise.reject(error)

    // /me / /login / /refresh-token — не пытаемся рефрешить (зацикливание).
    if (SILENT_API.some((p) => url.includes(p))) return Promise.reject(error)

    // Не ретраим повторно если уже пробовали — иначе бесконечный цикл при битом refresh.
    if (cfg?._retry) {
      window.location.assign('/login')
      return Promise.reject(error)
    }

    const ok = await tryRefresh()
    if (!ok) {
      window.location.assign('/login')
      return Promise.reject(error)
    }

    if (cfg) {
      cfg._retry = true
      return api.request(cfg)
    }
    return Promise.reject(error)
  },
)

/** Извлекает текст ошибки из { error } или ProblemDetails. */
export function pickApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { error?: string; title?: string; detail?: string }
      | undefined
    return data?.error ?? data?.detail ?? data?.title ?? err.message
  }
  return err instanceof Error ? err.message : 'Unknown error'
}
