import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import { PROJECTS_CONFIG, PORTAL_SECTIONS_CONFIG, PERMISSION_LABELS } from './types/users.types'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { RoleEditModal } from './RoleEditModal'
import type { Role, PermissionType } from './types/users.types'

function getActiveLabels(role: Role): { sections: string[]; perms: string[] } {
  const sections: string[] = []
  const permSet = new Set<PermissionType>()

  for (const config of PROJECTS_CONFIG) {
    const proj = role.projects[config.id]
    if (!proj?.enabled) continue
    sections.push(config.label)
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
    sections.push(config.label)
    if (sec.view)   permSet.add('view')
    if (sec.edit)   permSet.add('edit')
    if (sec.delete) permSet.add('delete')
  }

  const perms: PermissionType[] = ['view', 'edit', 'delete']
  return {
    sections,
    perms: perms.filter((p) => permSet.has(p)).map((p) => PERMISSION_LABELS[p]),
  }
}

export function RoleList() {
  const { roles, users, deleteRole }      = useUsersStore()
  const [deleteTarget, setDeleteTarget]   = useState<Role | null>(null)
  const [editRoleId,   setEditRoleId]     = useState<string | null>(null)

  const getUserCount = (roleId: string) => users.filter((u) => u.roleId === roleId).length

  return (
    <>
      <div className="overflow-hidden border-b border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-10 px-4 py-3 text-center text-xs font-semibold text-gray-400">#</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500">Название</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500">Разделы</th>
              <th className="px-4 py-3 text-left   text-xs font-semibold text-gray-500">Права</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Пользователей</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">Ролей пока нет</td>
              </tr>
            ) : (
              roles.map((role, idx) => {
                const { sections, perms } = getActiveLabels(role)
                return (
                  <tr key={role.id} className="bg-white transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-center text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sections.length > 0 ? sections.map((s) => (
                          <span key={s} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{s}</span>
                        )) : (
                          <span className="text-xs text-gray-400">Нет доступа</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {perms.length > 0 ? perms.map((p) => (
                          <span key={p} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{p}</span>
                        )) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{getUserCount(role.id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditRoleId(role.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(role)}
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
        title="Удалить роль?"
        description={deleteTarget ? `Роль «${deleteTarget.name}» будет удалена. Пользователи с этой ролью останутся без роли.` : ''}
        onConfirm={() => { deleteRole(deleteTarget!.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
      <RoleEditModal open={!!editRoleId} roleId={editRoleId} onClose={() => setEditRoleId(null)} />
    </>
  )
}
