import { Receipt, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/shared/utils/format'

/** Sticky bar внизу mobile-экрана: «открыть инвойс» либо подсказка о выборе позиций. */
export function MobileBottomBar({
  hasSelection,
  invoiceTotal,
  invoiceItemCnt,
  onOpenSheet,
}: {
  hasSelection: boolean
  invoiceTotal: number
  invoiceItemCnt: number
  onOpenSheet: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="md:hidden fixed inset-x-0 bottom-tabbar z-30 border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-[#111111]">
      {hasSelection ? (
        <button onClick={onOpenSheet} className="flex w-full items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[11px] font-medium text-gray-400 dark:text-[#929292]">{t('cart_total_label')}</p>
            <p className="text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(invoiceTotal)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900">
            <span>{invoiceItemCnt} {t('cart_positions')}</span>
            <ChevronUp className="h-3.5 w-3.5" />
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <Receipt className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-xs text-gray-400 dark:text-[#929292]">{t('cart_select_hint')}</p>
        </div>
      )}
    </div>
  )
}
