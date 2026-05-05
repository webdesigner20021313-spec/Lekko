import { useState } from 'react'
import { Plus } from 'lucide-react'
import { UserList } from './UserList'
import { UserCreateModal } from './UserCreateModal'
import type { User } from './types/users.types'

export function UsersPage() {
  const [userModal,   setUserModal]   = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  function handleEditUser(user: User) {
    setEditingUser(user)
    setUserModal(true)
  }

  function handleClose() {
    setUserModal(false)
    setEditingUser(null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Пользователи</h1>
        <button
          onClick={() => { setEditingUser(null); setUserModal(true) }}
          className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Добавить пользователя
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <UserList onEditUser={handleEditUser} />
      </div>
      <UserCreateModal open={userModal} onClose={handleClose} editUser={editingUser} />
    </div>
  )
}
