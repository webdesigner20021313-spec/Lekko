import { useEffect } from 'react'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import type { User } from '@/pages/Users/types/users.types'
import { useUsersList, type ApiDrugStoreUser } from './users'

/**
 * Тянет юзеров текущей аптеки и пушит в `useUsersStore.users`, чтобы UserList
 * видел свежий список. Возвращает refetch — вызывается после create.
 *
 * pharmacyAccess пока всегда `{ all: true, ids: [] }` — реальная привязка
 * сидит в отдельной таблице user_drug_stores и тянется через
 * GET /api/users/{id}/drug-stores. Подключим отдельной итерацией.
 */
export function useSyncUsers() {
  const drugStoreId = useAuthStore((s) => s.user?.drugStoreId ?? null)
  const setUsers = useUsersStore((s) => s.setUsers)
  const api = useUsersList(drugStoreId)

  useEffect(() => {
    if (!Array.isArray(api.data)) return
    setUsers(api.data.map(mapApiToUser))
  }, [api.data, setUsers])

  return {
    drugStoreId,
    refetch: api.refetch,
    isLoading: api.isLoading,
  }
}

export function mapApiToUser(u: ApiDrugStoreUser): User {
  return {
    id: String(u.id),
    name: u.fullName ?? u.login,
    phone: u.phone ?? '',
    email: u.email ?? undefined,
    login: u.login,
    password: '',  // backend не возвращает; в форме редактирования placeholder
    roleId: String(u.roleId),
    isActive: u.isActive,
    createdAt: u.createdAt,
    avatar: undefined,
    pharmacyAccess: { all: true, ids: [] },
  }
}
