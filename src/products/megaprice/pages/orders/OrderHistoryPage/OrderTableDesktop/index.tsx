import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { mp } from '@/products/megaprice/utils/path'
import type { Order } from '@/products/megaprice/pages/orders/types'
import { StatusBadge } from '../StatusBadge'

export function OrderTableDesktop({
  filteredOrders,
  totalCount,
  checked,
  setChecked,
}: {
  filteredOrders: Order[]
  totalCount: number
  checked: string[]
  setChecked: (next: string[] | ((p: string[]) => string[])) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const allChecked = filteredOrders.length > 0 && filteredOrders.every(o => checked.includes(o.id))
  const toggleAll  = () => setChecked(allChecked ? [] : filteredOrders.map(o => o.id))
  const toggleOne  = (id: string) => setChecked(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  return (
    <div className="hidden md:block overflow-x-auto border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
      <table className="w-full" style={{ minWidth: 700 }}>
        <thead>
          <tr className="h-14 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#222222]">
            <th className="w-14 px-3 py-2.5 text-center align-middle">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-gray-900"
              />
            </th>
            <th className="w-8 px-2 py-2.5 text-center text-xs font-semibold uppercase text-gray-400 dark:text-[#929292]">#</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('orders_col_number')}</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]" style={{ minWidth: 160 }}>{t('orders_col_pharmacy')}</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]" style={{ minWidth: 160 }}>{t('orders_col_distributor')}</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('orders_col_positions')}</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('orders_col_qty')}</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('orders_col_sum')}</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('orders_col_date')}</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('orders_col_status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
          {filteredOrders.map((order, idx) => {
            const totalItems  = order.lineCount
            const isChecked   = checked.includes(order.id)
            const hasProposal = order.groups.some(g => g.distributorStatus === 'offer')
            const go = () => navigate(mp(`/orders/${order.id}`))

            return (
              <tr
                key={order.id}
                className={cn(
                  'h-14 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                  isChecked && 'bg-gray-50 dark:bg-[#222222]',
                )}
              >
                <td className="px-3 py-2.5 text-center align-middle" onClick={e => { e.stopPropagation(); toggleOne(order.id) }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOne(order.id)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-gray-900"
                  />
                </td>
                <td className="px-2 py-2.5 text-center" onClick={go}>
                  <span className="text-xs text-gray-400">{idx + 1}</span>
                </td>
                <td className="px-3 py-2.5" onClick={go}>
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{order.number}</span>
                </td>
                <td className="px-3 py-2.5" onClick={go}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.pharmacyName}</p>
                  <p className="text-xs text-gray-400 dark:text-[#929292]">{order.pharmacyCity}</p>
                </td>
                <td className="px-3 py-2.5" onClick={go}>
                  {order.groups.length === 1 && order.groups[0].distributorName ? (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{order.groups[0].distributorName}</p>
                      <p className="text-xs text-gray-400 dark:text-[#929292]">{order.groups[0].distributorCity}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('orders_n_distributors', { n: order.groups.length })}</p>
                      <p className="truncate text-xs text-gray-400 dark:text-[#929292]" style={{ maxWidth: 180 }}>
                        {order.groups.map(g => g.distributorName).filter(Boolean).join(', ')}
                      </p>
                    </>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center" onClick={go}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{totalItems}</span>
                </td>
                <td className="px-3 py-2.5 text-center" onClick={go}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('orders_qty_n', { n: order.totalQty })}</span>
                </td>
                <td className="px-3 py-2.5 text-right" onClick={go}>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.totalSum)}</span>
                </td>
                <td className="px-3 py-2.5 text-right" onClick={go}>
                  <span className="text-sm text-gray-500 dark:text-[#929292]">{formatDate(order.createdAt)}</span>
                </td>
                <td className="px-3 py-2.5" onClick={go}>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={order.status} />
                    {hasProposal && (
                      <span title={t('orders_proposal_hint')}>
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-[#333333] dark:bg-[#222222]">
        <p className="text-xs text-gray-400 dark:text-[#929292]">
          {checked.length > 0
            ? t('orders_selected_n_of_m', { n: checked.length, m: filteredOrders.length })
            : t('orders_shown_n_of_m', { n: filteredOrders.length, m: totalCount })}
        </p>
      </div>
    </div>
  )
}
