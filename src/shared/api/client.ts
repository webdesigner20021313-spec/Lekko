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

// 401 → редирект на /login (кроме самой /login, /distributor-portal — это
// временная страница без логина, и /api/auth/me — её обрабатывает bootstrap).
const PUBLIC_PATHS = ['/login', '/distributor-portal']
const SILENT_API = ['/api/auth/me', '/api/auth/login', '/api/auth/refresh-token']

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''

    if (
      status === 401 &&
      typeof window !== 'undefined' &&
      !PUBLIC_PATHS.includes(window.location.pathname) &&
      !SILENT_API.some((p) => url.includes(p))
    ) {
      window.location.assign('/login')
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
