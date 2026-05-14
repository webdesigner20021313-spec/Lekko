import { useEffect } from 'react'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import type { Role } from '@/pages/Users/types/users.types'
import { useRolesList, type ApiDrugStoreRole } from './roles'

/**
 * Тянет роли текущей аптеки (по `useAuthStore.user.drugStoreId`) и пушит их в
 * `useUsersStore.roles`, чтобы UserList/UserCreateModal видели свежий список.
 * Возвращает { refetch, isLoading } для consumers которым нужно перезагрузить
 * список после create/update/delete.
 *
 * Backend хранит только { id, name, drugStoreId, companyId } — projects /
 * portalSections (UI-матрица проектов) у этой роли пока всегда пустые. Когда
 * подключим storage/orders функции, маппинг расширится здесь же.
 */
export function useSyncRoles() {
  const drugStoreId = useAuthStore((s) => s.user?.drugStoreId ?? null)
  const setRoles = useUsersStore((s) => s.setRoles)
  const api = useRolesList(drugStoreId)

  useEffect(() => {
    if (!Array.isArray(api.data)) return
    setRoles(api.data.map(mapApiToRole))
  }, [api.data, setRoles])

  return {
    drugStoreId,
    refetch: api.refetch,
    isLoading: api.isLoading,
  }
}

export function mapApiToRole(r: ApiDrugStoreRole): Role {
  return {
    id: String(r.id),
    name: r.name,
    projects: {},
    portalSections: {},
  }
}
