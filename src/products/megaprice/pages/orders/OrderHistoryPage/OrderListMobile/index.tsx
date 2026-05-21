import { ChevronRight, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { mp } from '@/products/megaprice/utils/path'
import type { Order } from '@/products/megaprice/pages/orders/types'
import { StatusBadge } from '../StatusBadge'

export function OrderListMobile({
  filteredOrders,
  totalCount,
}: {
  filteredOrders: Order[]
  totalCount: number
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="md:hidden divide-y divide-gray-100 dark:divide-[#333333]">
      {filteredOrders.map((order) => {
        const totalItems  = order.lineCount
        const hasProposal = order.groups.some(g => g.distributorStatus === 'offer')
        return (
          <button
            key={order.id}
            onClick={() => navigate(mp(`/orders/${order.id}`))}
            className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-gray-50 dark:active:bg-gray-800"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{order.number}</span>
                <StatusBadge status={order.status} />
                {hasProposal && (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
              </div>
              <p className="mt-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">{order.pharmacyName}</p>
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#929292]">
                {order.groups.length === 1 && order.groups[0].distributorName
                  ? `${order.groups[0].distributorName} · ${order.pharmacyCity}`
                  : `${t('orders_n_distributors', { n: order.groups.length })} · ${order.pharmacyCity}`}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400 dark:text-[#929292]">
                <span>{formatDate(order.createdAt)}</span>
                <span>·</span>
                <span>{totalItems} {t('orders_kpi_pcs')}</span>
                <span>·</span>
                <span>{t('orders_qty_n', { n: order.totalQty })}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
              <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(order.totalSum)}</span>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
            </div>
          </button>
        )
      })}
      <div className="bg-gray-50 px-4 py-2.5 dark:bg-[#222222]">
        <p className="text-xs text-gray-400 dark:text-[#929292]">
          {t('orders_shown_n_of_m', { n: filteredOrders.length, m: totalCount })}
        </p>
      </div>
    </div>
  )
}
