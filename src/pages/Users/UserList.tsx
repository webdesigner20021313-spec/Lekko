import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Building2 } from 'lucide-react'
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
      {/* Mobile cards — компактный вид: аватар + имя + статус + дата. Детали → BottomSheet */}
      <div className="md:hidden">
        {users.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">{t('users_empty')}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#262626]">
            {users.map((user) => {
              const role = getRole(user.roleId)
              return (
                <div
                  key={user.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onEditUser(user)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditUser(user) } }}
                  className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-[#1a1a1a]"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#929292]">
                      {role?.name ?? <span className="text-gray-400 dark:text-[#5e5e5e]">—</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      user.isActive
                        ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]'
                        : 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]',
                    )}>
                      {user.isActive ? t('user_active') : t('user_inactive')}
                    </span>
                    <span className="text-[11px] tabular-nums text-gray-400 dark:text-[#929292]">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>


      {/* Desktop table */}
      <div className="hidden overflow-hidden border-b border-gray-200 md:block dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#222222]">
              <th className="w-10 px-4 py-3 text-center text-xs font-semibold text-gray-400 dark:text-[#929292]">#</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('users_col_name')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('users_col_contact')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('users_col_role')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('users_col_pharmacies')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('users_col_status')}</th>
              <th className="px-4 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('users_col_created')}</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                  {t('users_empty')}
                </td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const role = getRole(user.roleId)
                return (
                  <tr key={user.id} className="bg-white dark:bg-[#090909] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">

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
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-[#222222] px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {role.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {user.pharmacyAccess.all ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-[#222222] px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <Building2 className="h-3 w-3" />
                          {t('user_pharmacies_all')}
                        </span>
                      ) : user.pharmacyAccess.ids.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-[#222222] px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <Building2 className="h-3 w-3" />
                          {t('user_pharmacies_count', { count: user.pharmacyAccess.ids.length })}
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
