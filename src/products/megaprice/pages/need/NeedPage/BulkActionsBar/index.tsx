import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Нижняя панель «выбрано N» + кнопка bulk-add-to-cart. */
export function BulkActionsBar({
  count,
  onCancel,
  onAddToCart,
}: {
  count: number
  onCancel: () => void
  onAddToCart: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-[#111111]">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {t('need_bulk_selected')} <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>
      </span>
      <div className="flex items-center gap-2">
        <button onClick={onCancel}
          className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:border-gray-300 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600">
          {t('need_bulk_cancel')}
        </button>
        <button onClick={onAddToCart}
          className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]">
          <Zap className="h-4 w-4" />
          {t('need_bulk_add_order')}
        </button>
      </div>
    </div>
  )
}
