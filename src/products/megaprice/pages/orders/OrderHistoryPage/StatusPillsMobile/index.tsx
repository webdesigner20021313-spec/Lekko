import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { OrderStatus } from '@/products/megaprice/pages/orders/types'
import { KPI_CARDS } from '../config'

export function StatusPillsMobile({
  totalCount,
  stats,
  statusFilter,
  setStatusFilter,
}: {
  totalCount: number
  stats: Record<OrderStatus, { count: number; total: number }>
  statusFilter: OrderStatus | 'all'
  setStatusFilter: (next: OrderStatus | 'all') => void
}) {
  const { t } = useTranslation()
  return (
    <div className="md:hidden shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
      <div className="flex gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
            statusFilter === 'all'
              ? 'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900'
              : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400',
          )}
        >
          {t('orders_filter_all')}
          <span className="tabular-nums opacity-70">{totalCount}</span>
        </button>
        {KPI_CARDS.map(({ status, labelKey }) => {
          const { count } = stats[status]
          const isActive = statusFilter === status
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? 'all' : status)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900'
                  : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400',
              )}
            >
              {t(labelKey)}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
