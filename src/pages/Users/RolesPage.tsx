import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { RoleList } from './RoleList'
import { RoleCreateModal } from './RoleCreateModal'

export function RolesPage() {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#090909]">
      {/* Desktop header (на мобиле заголовок в глобальном Header, кнопка — в sticky bottom bar) */}
      <div className="hidden shrink-0 border-b border-gray-200 px-6 py-3 md:flex md:items-center md:justify-between dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('nav_roles')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
        >
          <Plus className="h-4 w-4" />
          {t('roles_create_btn')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <RoleList />
      </div>

      {/* Mobile sticky bottom bar: primary action «Создать роль» */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-safe md:hidden dark:border-gray-700 dark:bg-[#090909]">
        <button
          onClick={() => setModalOpen(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white active:bg-black dark:bg-[#f1f1f1] dark:text-gray-900"
        >
          <Plus className="h-4 w-4" />
          {t('roles_create_btn')}
        </button>
      </div>

      <RoleCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
