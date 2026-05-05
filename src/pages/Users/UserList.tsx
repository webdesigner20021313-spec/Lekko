import { useState } from 'react'
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
  const { users, roles, deleteUser } = useUsersStore()
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const getRole = (roleId: string | null) => roles.find((r) => r.id === roleId)

  return (
    <>
      <div className="overflow-hidden border-b border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-10 px-4 py-3 text-center text-xs font-semibold text-gray-400">#</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500">Имя</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500">Телефон / Email</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500">Роль</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500">Статус</th>
              <th className="px-4 py-3 text-right  text-xs font-semibold text-gray-500">Добавлен</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                  Пользователей пока нет
                </td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const role = getRole(user.roleId)
                return (
                  <tr key={user.id} className="bg-white transition-colors hover:bg-gray-50">

                    {/* # */}
                    <td className="px-4 py-3 text-center text-xs text-gray-400">{idx + 1}</td>

                    {/* Имя + аватар */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>

                    {/* Телефон / Email */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{user.phone}</p>
                      {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                    </td>

                    {/* Роль */}
                    <td className="px-4 py-3">
                      {role ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {role.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Статус */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        user.isActive
                          ? 'bg-[#D1FAE5] text-[#065F46]'
                          : 'bg-[#FEE2E2] text-[#991B1B]'
                      )}>
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>

                    {/* Дата */}
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Действия */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditUser(user)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
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
        title="Удалить пользователя?"
        description={deleteTarget ? `Пользователь «${deleteTarget.name}» будет удалён без возможности восстановления.` : ''}
        onConfirm={() => { deleteUser(deleteTarget!.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
