import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

/**
 * DTO бекенда — `DrugStoreRole` сериализуется в camelCase ASP.NET-ом.
 * Phase 4.6 (см. ABU.DrugStore.Domain/Entities/DrugStoreRole.cs):
 *   id          — логический id роли в рамках одной аптеки
 *   drug_store_id — owner (NOT NULL)
 *   company_id  — сеть аптек (nullable)
 */
export interface ApiDrugStoreRole {
  pk: number
  id: number
  name: string
  drugStoreId: number
  companyId: number | null
  isDeleted: boolean
  createdAt: string
}

export interface CreateRolePayload {
  name: string
  drugStoreId: number
  companyId?: number | null
  storageFunctionIds?: number[]
  ordersFunctionIds?: number[]
}

export interface UpdateRolePayload extends CreateRolePayload {
  roleId: number
}

/** GET /api/access/roles?drugStoreId=… — список ролей одной аптеки. */
export function useRolesList(drugStoreId: number | null | undefined) {
  return useQueryApiClient<ApiDrugStoreRole[]>({
    request: {
      url: '/api/access/roles',
      method: 'GET',
      params: drugStoreId ? { drugStoreId } : undefined,
    },
    enabled: !!drugStoreId,
  })
}

/** POST /api/access/roles — создать роль (+ accesslist'ы). */
export function useCreateRole(
  onSuccess?: (data: { roleId: number; drugStoreId: number }) => void,
  onError?: (message: string) => void,
) {
  return useQueryApiClient<{ roleId: number; drugStoreId: number }>({
    request: { url: '/api/access/roles', method: 'POST', disableOnMount: true },
    onSuccess: (data) => onSuccess?.(data as { roleId: number; drugStoreId: number }),
    onError: (msg) => onError?.(typeof msg === 'string' ? msg : 'Request failed'),
  })
}

/** PUT /api/access/roles/{roleId} — обновить имя + accesslist'ы. */
export function useUpdateRole(
  onSuccess?: () => void,
  onError?: (message: string) => void,
) {
  return useQueryApiClient({
    request: { url: '/api/access/roles/:roleId', method: 'PUT', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (msg) => onError?.(typeof msg === 'string' ? msg : 'Request failed'),
  })
}

/** DELETE /api/access/roles/{roleId}/drug-store/{drugStoreId} — soft-delete. */
export function useDeleteRole(
  onSuccess?: () => void,
  onError?: (message: string) => void,
) {
  return useQueryApiClient({
    request: {
      url: '/api/access/roles/:roleId/drug-store/:drugStoreId',
      method: 'DELETE',
      disableOnMount: true,
    },
    onSuccess: () => onSuccess?.(),
    onError: (msg) => onError?.(typeof msg === 'string' ? msg : 'Request failed'),
  })
}
