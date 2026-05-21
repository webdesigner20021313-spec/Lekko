import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import { PROJECTS_CONFIG, PORTAL_SECTIONS_CONFIG } from './types/users.types'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { RoleEditModal } from './RoleEditModal'
import { useDeleteRole } from './api/roles'
import type { Role, PermissionType } from './types/users.types'

function getActiveLabels(
  role: Role,
  t: TFunction
): { sections: string[]; perms: string[] } {
  const sections: string[] = []
  const permSet = new Set<PermissionType>()

  for (const config of PROJECTS_CONFIG) {
    const proj = role.projects[config.id]
    if (!proj?.enabled) continue
    sections.push(config.id === 'users' ? t('nav_users') : config.label)
    for (const sec of Object.values(proj.sections)) {
      if (!sec.enabled) continue
      if (sec.view)   permSet.add('view')
      if (sec.edit)   permSet.add('edit')
      if (sec.delete) permSet.add('delete')
    }
  }

  for (const config of PORTAL_SECTIONS_CONFIG) {
    const sec = role.portalSections[config.id]
    if (!sec?.enabled) continue
    sections.push(t(`role_sec_${config.id.replace('-', '_')}`, config.label))
    if (sec.view)   permSet.add('view')
    if (sec.edit)   permSet.add('edit')
    if (sec.delete) permSet.add('delete')
  }

  const perms: PermissionType[] = ['view', 'edit', 'delete']
  return {
    sections,
    perms: perms.filter((p) => permSet.has(p)).map((p) => t(`perm_${p}`)),
  }
}

interface Props {
  drugStoreId:  number | null
  refetchRoles: () => void
  isLoading:    boolean
}

export function RoleList({ drugStoreId, refetchRoles, isLoading }: Props) {
  const { t } = useTranslation()
  const { roles, users }                = useUsersStore()
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [editRoleId,   setEditRoleId]   = useState<string | null>(null)

  const deleteApi = useDeleteRole(refetchRoles)

  const getUserCount = (roleId: string) => users.filter((u) => u.roleId === roleId).length

  function handleConfirmDelete() {
    if (!deleteTarget || !drugStoreId) return
    deleteApi.appendData(undefined, {
      roleId: Number(deleteTarget.id),
      drugStoreId,
    })
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="overflow-hidden border-b border-gray-200 dark:border-[#333333]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#222222]">
              <th className="w-10 px-4 py-3 text-center text-xs font-semibold text-gray-400 dark:text-[#929292]">#</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('roles_col_name')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('roles_col_sections')}</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('roles_col_perms')}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('roles_col_users')}</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {isLoading && roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">…</td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">{t('roles_empty')}</td>
              </tr>
            ) : (
              roles.map((role, idx) => {
                const { sections, perms } = getActiveLabels(role, t)
                return (
                  <tr key={role.id} className="bg-white dark:bg-[#111111] transition-colors hover:bg-gray-50 dark:hover:bg-[#222222]">
                    <td className="px-4 py-3 text-center text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{role.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sections.length > 0 ? sections.map((s) => (
                          <span key={s} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-[#222222] px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">{s}</span>
                        )) : (
                          <span className="text-xs text-gray-400">{t('roles_no_access')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {perms.length > 0 ? perms.map((p) => (
                          <span key={p} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-[#222222] px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">{p}</span>
                        )) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{getUserCount(role.id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditRoleId(role.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222222] hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(role)}
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
        title={t('roles_delete_title')}
        description={deleteTarget ? t('roles_delete_desc', { name: deleteTarget.name }) : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <RoleEditModal
        open={!!editRoleId}
        roleId={editRoleId}
        drugStoreId={drugStoreId}
        onClose={() => setEditRoleId(null)}
        onUpdated={refetchRoles}
      />
    </>
  )
}
