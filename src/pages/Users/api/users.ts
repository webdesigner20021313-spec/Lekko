import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

/**
 * DTO бекенда — `DrugStoreUser` сериализуется в camelCase ASP.NET-ом.
 * Phase 4 (см. ABU.DrugStore.Domain/Entities/DrugStoreUser.cs).
 */
export interface ApiDrugStoreUser {
  id: number
  drugStoreId: number
  companyId: number | null
  roleId: number
  login: string
  passwordHash?: string  // приходит, но фронт не использует
  fullName: string | null
  email: string | null
  phone: string | null
  telegramId: number | null
  isActive: boolean
  isDeleted: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  mustChangePassword: boolean
  individualKey: number | null
}

export interface CreateUserPayload {
  drugStoreId: number
  companyId: number | null
  roleId: number
  login: string
  password: string
  fullName?: string | null
  email?: string | null
  phone?: string | null
  telegramId?: number | null
  individualKey?: number | null
}

/** GET /api/users/list?drugStoreId=… — список юзеров одной аптеки. */
export function useUsersList(drugStoreId: number | null | undefined) {
  return useQueryApiClient<ApiDrugStoreUser[]>({
    request: {
      url: '/api/users/list',
      method: 'GET',
      params: drugStoreId ? { drugStoreId } : undefined,
    },
    enabled: !!drugStoreId,
  })
}

/**
 * POST /api/users — создать юзера (drug_store_users).
 * Backend хэширует password BCrypt'ом, требует login>=3 chars, password>=6 chars.
 * 409 — login уже занят в этой аптеке (UNIQUE drug_store_id+login).
 */
export function useCreateUser(
  onSuccess?: (data: { id: number }) => void,
  onError?: (message: string) => void,
) {
  return useQueryApiClient<{ id: number }>({
    request: { url: '/api/users', method: 'POST', disableOnMount: true },
    onSuccess: (data) => onSuccess?.(data as { id: number }),
    onError: (msg) => onError?.(typeof msg === 'string' ? msg : 'Request failed'),
  })
}
