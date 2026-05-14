import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { RoleList } from './RoleList'
import { RoleCreateModal } from './RoleCreateModal'
import { useSyncRoles } from './api/useSyncRoles'

export function RolesPage() {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const { drugStoreId, refetch, isLoading } = useSyncRoles()

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('nav_roles')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          disabled={!drugStoreId}
          className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
        >
          <Plus className="h-4 w-4" />
          {t('roles_create_btn')}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RoleList drugStoreId={drugStoreId} refetchRoles={refetch} isLoading={isLoading} />
      </div>
      <RoleCreateModal
        open={modalOpen}
        drugStoreId={drugStoreId}
        onClose={() => setModalOpen(false)}
        onCreated={refetch}
      />
    </div>
  )
}
