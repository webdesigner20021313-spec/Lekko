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
  avatarObjectName: string | null
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

/**
 * UpdateUserRequest на бекенде — все поля опциональны (partial-патч).
 * Password если непустой — пере-хэшируется на бекенде.
 */
export interface UpdateUserPayload {
  roleId?: number | null
  password?: string | null
  fullName?: string | null
  email?: string | null
  phone?: string | null
  telegramId?: number | null
  individualKey?: number | null
  isActive?: boolean | null
}

/** PUT /api/users/{id} — частичный апдейт юзера. */
export function useUpdateUser(
  onSuccess?: () => void,
  onError?: (message: string) => void,
) {
  return useQueryApiClient({
    request: { url: '/api/users/:id', method: 'PUT', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (msg) => onError?.(typeof msg === 'string' ? msg : 'Request failed'),
  })
}

/** DELETE /api/users/{id} — soft-delete (is_deleted=TRUE). */
export function useDeleteUser(
  onSuccess?: () => void,
  onError?: (message: string) => void,
) {
  return useQueryApiClient({
    request: { url: '/api/users/:id', method: 'DELETE', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (msg) => onError?.(typeof msg === 'string' ? msg : 'Request failed'),
  })
}

/**
 * Загрузка аватара: multipart с полем `file`. После create/update юзера фронт
 * шлёт этот запрос если выбран новый файл. Стрим из MinIO потом отдаёт GET
 * /api/users/{id}/avatar.
 */
export async function uploadUserAvatar(userId: number, file: File): Promise<void> {
  const fd = new FormData()
  fd.append('file', file)
  const { api } = await import('@/shared/api/client')
  await api.post(`/api/users/${userId}/avatar`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteUserAvatar(userId: number): Promise<void> {
  const { api } = await import('@/shared/api/client')
  await api.delete(`/api/users/${userId}/avatar`)
}

/**
 * URL картинки аватара для рендера в <img>. updatedAt используется как
 * cache-buster — иначе браузер кэширует старую картинку после загрузки новой.
 *
 * Возвращает АБСОЛЮТНЫЙ URL на gateway, потому что <img> идёт через нативный
 * fetch браузера и не знает про axios.baseURL. Endpoint `[AllowAnonymous]`
 * на бекенде, так что cookies не нужны.
 */
export function buildAvatarUrl(userId: number, updatedAt: string | null): string {
  const v = updatedAt ? encodeURIComponent(updatedAt) : Date.now().toString()
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'
  return `${base}/api/users/${userId}/avatar?v=${v}`
}
