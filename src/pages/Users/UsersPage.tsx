import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { UserList } from './UserList'
import { UserCreateModal } from './UserCreateModal'
import type { User } from './types/users.types'

export function UsersPage() {
  const { t } = useTranslation()
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
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('nav_users')}</h1>
        <button
          onClick={() => { setEditingUser(null); setUserModal(true) }}
          className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
        >
          <Plus className="h-4 w-4" />
          {t('users_add')}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <UserList onEditUser={handleEditUser} />
      </div>
      <UserCreateModal open={userModal} onClose={handleClose} editUser={editingUser} />
    </div>
  )
}
