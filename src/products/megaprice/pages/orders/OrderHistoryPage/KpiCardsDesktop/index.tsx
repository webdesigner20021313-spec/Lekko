import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { OrderStatus } from '@/products/megaprice/pages/orders/types'
import { KPI_CARDS } from '../config'

export function KpiCardsDesktop({
  stats,
  statusFilter,
  setStatusFilter,
}: {
  stats: Record<OrderStatus, { count: number; total: number }>
  statusFilter: OrderStatus | 'all'
  setStatusFilter: (next: OrderStatus | 'all') => void
}) {
  const { t } = useTranslation()
  return (
    <div className="hidden md:block shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-[#111111]">
      <div className="grid grid-cols-4 gap-3">
        {KPI_CARDS.map(({ status, labelKey }) => {
          const { count, total } = stats[status]
          const isActive = statusFilter === status
          return (
            <div
              key={status}
              onClick={() => setStatusFilter(isActive ? 'all' : status)}
              className={cn(
                'flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all dark:bg-[#222222]',
                isActive ? 'border-gray-900 ring-1 ring-gray-900 dark:border-[#f1f1f1] dark:ring-[#f1f1f1]' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t(labelKey)}</p>
              <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                <p className="text-2xl font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100">
                  {count} <span className="text-sm font-medium text-gray-400 dark:text-[#929292]">{t('orders_kpi_pcs')}</span>
                </p>
                <p className="text-sm font-semibold text-gray-500 dark:text-[#929292]">{formatCurrency(total)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
