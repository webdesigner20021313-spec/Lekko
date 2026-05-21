import { Phone, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/shared/utils/format'
import type { Wholesaler } from '@/products/megaprice/mocks/wholesalers.mocks'
import { DiscountActionCell, DiscountValueCell } from '../DiscountCells'

export function WholesalersTable({
  wholesalers,
  page,
  pageSize,
  onOpenDiscount,
}: {
  wholesalers: Wholesaler[]
  page: number
  pageSize: number
  onOpenDiscount: (w: Wholesaler) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="hidden md:block overflow-hidden border-b border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#222222]">
            <th className="w-10 px-4 py-3.5 text-center text-xs font-semibold uppercase text-gray-400 dark:text-[#929292]">#</th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]" style={{ minWidth: 160 }}>{t('ws_col_name')}</th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_city')}</th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_phone')}</th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_telegram')}</th>
            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_min_order')}</th>
            <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_delivery')}</th>
            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_my_discount')}</th>
            <th className="px-4 py-3.5 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
          {wholesalers.map((w, idx) => (
            <tr key={w.id} className="h-14 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">

              <td className="px-4 py-3.5 text-center">
                <span className="text-xs text-gray-400">{(page - 1) * pageSize + idx + 1}</span>
              </td>

              <td className="px-4 py-3.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{w.name}</p>
              </td>

              <td className="px-4 py-3.5">
                <p className="text-sm text-gray-600 dark:text-gray-400">{w.city}</p>
              </td>

              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{w.phone}</span>
                </div>
              </td>

              <td className="px-4 py-3.5">
                {w.telegram ? (
                  <div className="flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{w.telegram}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                )}
              </td>

              <td className="px-4 py-3.5 text-right">
                <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(w.minOrderSum)}</span>
              </td>

              <td className="px-4 py-3.5 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('ws_delivery_days', { n: w.deliveryDays })}</span>
              </td>

              <td className="px-4 py-3.5">
                <DiscountValueCell wholesaler={w} />
              </td>
              <td className="px-4 py-3.5">
                <DiscountActionCell wholesaler={w} onOpen={() => onOpenDiscount(w)} />
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
