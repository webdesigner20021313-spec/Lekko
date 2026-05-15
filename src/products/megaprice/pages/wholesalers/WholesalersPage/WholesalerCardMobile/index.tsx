import { Phone, Send, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/shared/utils/format'
import type { Wholesaler } from '@/products/megaprice/mocks/wholesalers.mocks'

export function WholesalerCardMobile({
  wholesaler: w,
  onOpenDiscount,
}: {
  wholesaler: Wholesaler
  onOpenDiscount: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{w.name}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">{w.city}</p>
        </div>
        <div className="shrink-0">
          {w.discountPercent !== null ? (
            <button
              onClick={onOpenDiscount}
              className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]"
            >
              −{w.discountPercent}%
              <Pencil className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={onOpenDiscount}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400"
            >
              <Plus className="h-3 w-3" />
              {t('ws_modal_add_title')}
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
        <a href={`tel:${w.phone}`} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
          <Phone className="h-3 w-3 shrink-0 text-gray-400" />
          <span className="truncate">{w.phone}</span>
        </a>
        {w.telegram ? (
          <a href={`https://t.me/${w.telegram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <Send className="h-3 w-3 shrink-0 text-sky-500" />
            <span className="truncate">{w.telegram}</span>
          </a>
        ) : <div />}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#929292]">
          <span className="text-gray-400">{t('ws_col_min_order')}:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(w.minOrderSum)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#929292]">
          <span className="text-gray-400">{t('ws_col_delivery')}:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{t('ws_delivery_days', { n: w.deliveryDays })}</span>
        </div>
      </div>
    </div>
  )
}
