/**
 * Account — смена пароля, активные сессии, профиль (email/phone), реквизиты аптеки.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

export interface SessionDto {
  id: number
  createdAt: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
  /** UUID устройства (cookie). Используется для kick без affecting других устройств. */
  deviceId: string | null
  isCurrent: boolean
}

/**
 * POST /api/auth/change-password — смена пароля.
 * Бэк revoke'ает refresh-токены ДРУГИХ устройств; текущая сессия остаётся.
 */
export function useChangePassword() {
  return useQueryApiClient({
    request: { url: '/api/auth/change-password', method: 'POST', disableOnMount: true },
    onSuccess: (data, pass) => {
      if (typeof pass === 'function') (pass as (d: unknown) => void)(data)
    },
  })
}

/** GET /api/auth/sessions — активные refresh-токены текущего юзера. */
export function useActiveSessions() {
  return useQueryApiClient<SessionDto[]>({
    request: { url: '/api/auth/sessions', method: 'GET' },
  })
}

/** DELETE /api/auth/sessions/others — закрыть все сессии кроме текущей. */
export function useRevokeOtherSessions() {
  return useQueryApiClient({
    request: { url: '/api/auth/sessions/others', method: 'DELETE', disableOnMount: true },
    onSuccess: (data, pass) => {
      if (typeof pass === 'function') (pass as (d: unknown) => void)(data)
    },
  })
}

/** DELETE /api/auth/sessions/:id — закрыть одну сессию по id. */
export function useRevokeSession() {
  return useQueryApiClient({
    request: { url: '/api/auth/sessions/:id', method: 'DELETE', disableOnMount: true },
    onSuccess: (data, pass) => {
      if (typeof pass === 'function') (pass as (d: unknown) => void)(data)
    },
  })
}

/** POST /api/auth/update-profile — смена email/phone текущего user'а. */
export function useUpdateProfile() {
  return useQueryApiClient({
    request: { url: '/api/auth/update-profile', method: 'POST', disableOnMount: true },
    onSuccess: (data, pass) => {
      if (typeof pass === 'function') (pass as (d: unknown) => void)(data)
    },
  })
}

/** GET /api/drugstores/{id}/settings — drug_store_settings (РО реквизиты компании). */
export interface DrugStoreSettingsDto {
  drugStoreId: number
  appLang?: string | null
  oficialcompanyname?: string | null
  oficialcompanyaddress?: string | null
  companyphones?: string | null
  companybankaccount?: string | null
  companybankname?: string | null
  inn?: string | null
  oked?: string | null
  okonh?: string | null
  mfo?: string | null
  ndsRegNum?: string | null
  paymentCardNo?: string | null
  paymentCardUserName?: string | null
  gnkLicenseDate?: string | null
  referentPricesLicenseDate?: string | null
  kerioLicenseDate?: string | null
  drugStoreNds?: number | null
}
export function useDrugStoreSettings(drugStoreId: number | null) {
  return useQueryApiClient<DrugStoreSettingsDto>({
    request: { url: `/api/drugstores/${drugStoreId ?? 0}/settings`, method: 'GET' },
    enabled: !!drugStoreId,
  })
}
