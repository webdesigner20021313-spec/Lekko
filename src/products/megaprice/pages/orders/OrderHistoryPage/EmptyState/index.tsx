import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#222222]">
        <Package className="h-5 w-5 text-gray-400 dark:text-[#929292]" />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {hasFilters ? t('orders_no_results_title') : t('orders_empty_title')}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-[#929292]">
        {hasFilters ? t('orders_no_results_hint') : t('orders_empty_hint')}
      </p>
    </div>
  )
}
