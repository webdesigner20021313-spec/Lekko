import { create } from 'zustand'
import type { User, Role } from '@/pages/Users/types/users.types'

interface UsersState {
  // Юзеры тянутся из API (drug_store_users) — наполняются через setUsers в
  // UsersPage (useSyncUsers). Локальные addUser/updateUser/deleteUser держим
  // только для оптимистичной правки, но они не персистят на бекенд (это будет
  // следующей итерацией).
  users: User[]
  // Аналогично — роли (drug_store_roles), наполняются через setRoles.
  roles: Role[]
  addUser:    (data: Omit<User, 'id' | 'createdAt'>) => void
  updateUser: (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>) => void
  deleteUser: (id: string) => void
  setUsers:   (users: User[]) => void
  setRoles:   (roles: Role[]) => void
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}`
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  roles: [],

  addUser: (data) =>
    set((s) => ({
      users: [...s.users, { ...data, id: genId('u'), createdAt: new Date().toISOString() }],
    })),

  updateUser: (id, data) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)) })),

  deleteUser: (id) =>
    set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

  setUsers: (users) => set({ users }),
  setRoles: (roles) => set({ roles }),
}))
