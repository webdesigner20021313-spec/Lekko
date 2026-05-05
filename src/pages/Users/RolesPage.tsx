import { useState } from 'react'
import { Plus } from 'lucide-react'
import { RoleList } from './RoleList'
import { RoleCreateModal } from './RoleCreateModal'

export function RolesPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Роли</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Создать роль
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RoleList />
      </div>
      <RoleCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
