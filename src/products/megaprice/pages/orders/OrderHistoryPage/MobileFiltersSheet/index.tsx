import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { BottomSheet } from '@/shared/ui-kit/BottomSheet'
import type { OrderStatus } from '@/products/megaprice/pages/orders/types'
import { KPI_CARDS } from '../config'
import { ISOtoDMY } from '../helpers'
import { RangeCalendar } from '../RangeCalendar'

export function MobileFiltersSheet({
  open,
  onClose,
  calFrom,
  calTo,
  setCalFrom,
  setCalTo,
  setDateRange,
  setSearch,
  statusFilter,
  setStatusFilter,
  stats,
}: {
  open: boolean
  onClose: () => void
  calFrom: string
  calTo: string
  setCalFrom: (v: string) => void
  setCalTo: (v: string) => void
  setDateRange: (v: string) => void
  setSearch: (v: string) => void
  statusFilter: OrderStatus | 'all'
  setStatusFilter: (next: OrderStatus | 'all') => void
  stats: Record<OrderStatus, { count: number; total: number }>
}) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('orders_filters')}
      maxHeight="85vh"
      footer={
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStatusFilter('all')
              setCalFrom('')
              setCalTo('')
              setDateRange('')
              setSearch('')
            }}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            {t('orders_date_clear')}
          </button>
          <button
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900"
          >
            {t('orders_apply')}
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5 pb-8">
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('orders_col_date')}</p>
          <RangeCalendar
            from={calFrom}
            to={calTo}
            onChange={(f, to) => {
              setCalFrom(f)
              setCalTo(to)
              if (f && to) {
                setDateRange(`${ISOtoDMY(f)} - ${ISOtoDMY(to)}`)
              } else {
                setDateRange(f ? ISOtoDMY(f) : '')
              }
            }}
          />
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('orders_col_status')}</p>
          <div className="grid grid-cols-2 gap-2">
            {KPI_CARDS.map(({ status, labelKey }) => {
              const { count } = stats[status]
              const isActive = statusFilter === status
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(isActive ? 'all' : status)}
                  className={cn(
                    'flex h-11 items-center justify-between rounded-xl border px-4 text-sm font-medium',
                    isActive
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300',
                  )}
                >
                  <span>{t(labelKey)}</span>
                  <span className="tabular-nums opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
