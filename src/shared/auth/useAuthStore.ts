import { create } from 'zustand'
import { AxiosError } from 'axios'
import { api, pickApiError } from '@/shared/api/client'
import type {
  AuthUser,
  DrugStoreInfo,
  LicenseExpiredError,
  LicenseInfo,
  MeResponse,
} from '@/shared/api/types'

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'license_expired'; details: LicenseExpiredError }
  | { ok: false; reason: 'invalid_credentials'; message: string }
  | { ok: false; reason: 'network'; message: string }

interface AuthState {
  user: AuthUser | null
  drugStore: DrugStoreInfo | null
  license: LicenseInfo | null

  isAuthenticated: boolean
  /** false до первой попытки `/me` после reload — не редиректим раньше этого. */
  hasBootstrapped: boolean

  bootstrap: () => Promise<void>
  login: (login: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
}

// Module-level дедуп для bootstrap (один /api/auth/me на одновременных подписчиков).
let bootstrapInFlight: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  drugStore: null,
  license: null,
  isAuthenticated: false,
  hasBootstrapped: false,

  async bootstrap() {
    // Дедуп: PrivateRoute с React StrictMode фаерит bootstrap дважды на mount.
    // Также из других мест могут быть параллельные подписчики. Один в полёте —
    // все остальные ждут результат, не делая новый /api/auth/me запрос.
    if (bootstrapInFlight) return bootstrapInFlight
    bootstrapInFlight = (async () => {
      try {
        const { data } = await api.get<MeResponse>('/api/auth/me')
        set({
          user: data.user,
          drugStore: data.drugStore,
          license: data.license,
          isAuthenticated: true,
          hasBootstrapped: true,
        })
      } catch {
        set({
          user: null,
          drugStore: null,
          license: null,
          isAuthenticated: false,
          hasBootstrapped: true,
        })
      } finally {
        bootstrapInFlight = null
      }
    })()
    return bootstrapInFlight
  },

  async login(login, password) {
    try {
      const { data } = await api.post<MeResponse>('/api/auth/login', {
        login: login.trim(),
        password,
      })
      set({
        user: data.user,
        drugStore: data.drugStore,
        license: data.license,
        isAuthenticated: true,
        hasBootstrapped: true,
      })
      return { ok: true }
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 403) {
          const body = err.response.data as Partial<LicenseExpiredError>
          if (body?.licenseExpired) {
            return {
              ok: false,
              reason: 'license_expired',
              details: body as LicenseExpiredError,
            }
          }
        }
        if (err.response?.status === 401) {
          return {
            ok: false,
            reason: 'invalid_credentials',
            message: pickApiError(err),
          }
        }
      }
      return { ok: false, reason: 'network', message: pickApiError(err) }
    }
  },

  async logout() {
    try {
      await api.post('/api/auth/logout')
    } catch {
      /* ignore — даже при ошибке стираем локальную сессию */
    }
    set({
      user: null,
      drugStore: null,
      license: null,
      isAuthenticated: false,
      hasBootstrapped: true,
    })
  },
}))
