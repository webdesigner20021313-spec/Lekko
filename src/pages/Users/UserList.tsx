import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { formatDate } from '@/shared/utils/format'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import type { User } from './types/users.types'

interface Props {
  onEditUser: (user: User) => void
}

export function UserList({ onEditUser }: Props) {
  const { t } = useTranslation()
  const { users, roles, deleteUser } = useUsersStore()
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const getRole = (roleId: string | null) => roles.find((r) => r.id === roleId)

  return (
    <>
      <div className="overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#222222]">
              <th className="w-10 px-4 py-3 text-center text-xs font-semibold text-gray-400">#</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-gray-400">{t('users_col_name')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-gray-400">{t('users_col_contact')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-gray-400">{t('users_col_role')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-gray-400">{t('users_col_status')}</th>
              <th className="px-4 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-gray-400">{t('users_col_created')}</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                  {t('users_empty')}
                </td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const role = getRole(user.roleId)
                return (
                  <tr key={user.id} className="bg-white dark:bg-[#111111] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">

                    <td className="px-4 py-3 text-center text-xs text-gray-400">{idx + 1}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{user.phone}</p>
                      {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                    </td>

                    <td className="px-4 py-3">
                      {role ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {role.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        user.isActive
                          ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]'
                          : 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]'
                      )}>
                        {user.isActive ? t('user_active') : t('user_inactive')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditUser(user)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title={t('users_delete_title')}
        description={deleteTarget ? t('users_delete_desc', { name: deleteTarget.name }) : ''}
        onConfirm={() => { deleteUser(deleteTarget!.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
