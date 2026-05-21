import { Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Wholesaler } from '@/products/megaprice/mocks/wholesalers.mocks'

export function DiscountValueCell({ wholesaler }: { wholesaler: Wholesaler }) {
  if (wholesaler.discountPercent !== null) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]">
        −{wholesaler.discountPercent}%
      </span>
    )
  }
  return <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
}

export function DiscountActionCell({ wholesaler, onOpen }: { wholesaler: Wholesaler; onOpen: () => void }) {
  const { t } = useTranslation()
  if (wholesaler.discountPercent !== null) {
    return (
      <button
        onClick={onOpen}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
        title={t('ws_modal_edit_title')}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    )
  }
  return (
    <button
      onClick={onOpen}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
      title={t('ws_modal_add_title')}
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  )
}
