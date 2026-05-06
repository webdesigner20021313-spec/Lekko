import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Download, Calendar, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { useOrdersStore } from '@/products/megaprice/stores/useOrdersStore'
import { mp } from '@/products/megaprice/utils/path'
import {
  ORDER_STATUS_CONFIG,
  type OrderStatus,
  type Order,
} from '@/products/megaprice/pages/orders/types'

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  const { bg, text } = ORDER_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', bg, text)}>
      {t(`order_status_${status}`)}
    </span>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {hasFilters ? t('orders_no_results_title') : t('orders_empty_title')}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {hasFilters ? t('orders_no_results_hint') : t('orders_empty_hint')}
      </p>
    </div>
  )
}

// ─── Export helper ────────────────────────────────────────────────────────────

function exportToExcel(orders: Order[], t: (key: string, opts?: Record<string, unknown>) => string) {
  const rows = orders.map((o, i) => ({
    [t('orders_excel_num')]:          i + 1,
    [t('orders_excel_number')]:       o.number,
    [t('orders_excel_pharmacy')]:     o.pharmacyName,
    [t('orders_excel_city')]:         o.pharmacyCity,
    [t('orders_excel_distributors')]: o.groups.map(g => g.distributorName).join(', '),
    [t('orders_excel_positions')]:    o.groups.reduce((s, g) => s + g.items.length, 0),
    [t('orders_excel_qty')]:          o.totalQty,
    [t('orders_excel_sum')]:          o.totalSum,
    [t('orders_excel_date')]:         formatDate(o.createdAt),
    [t('orders_excel_status')]:       t(`order_status_${o.status}`),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, t('orders_excel_sheet'))
  XLSX.writeFile(wb, t('orders_excel_file'))
}

// ─── OrderHistoryPage ─────────────────────────────────────────────────────────

export function OrderHistoryPage() {
  const { t } = useTranslation()
  const navigate   = useNavigate()
  const orders     = useOrdersStore(s => s.orders)
  const [search,       setSearch]       = useState('')
  const [dateRange,    setDateRange]    = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [checked,      setChecked]      = useState<string[]>([])

  const dateFrom = dateRange.split(' - ')[0]?.trim() ?? ''
  const dateTo   = dateRange.split(' - ')[1]?.trim() ?? ''

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        if (search.trim()) {
          const q = search.toLowerCase()
          const match =
            o.number.toLowerCase().includes(q) ||
            o.pharmacyName.toLowerCase().includes(q) ||
            o.pharmacyCity.toLowerCase().includes(q) ||
            o.groups.some(g => g.distributorName.toLowerCase().includes(q))
          if (!match) return false
        }
        if (statusFilter !== 'all' && o.status !== statusFilter) return false
        if (dateFrom && o.createdAt.slice(0, 10) < dateFrom) return false
        if (dateTo   && o.createdAt.slice(0, 10) > dateTo)   return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [search, statusFilter, dateFrom, dateTo])

  const hasFilters = search.trim().length > 0 || statusFilter !== 'all' || !!dateRange.trim()

  const stats = useMemo(() => {
    const byStatus = (s: OrderStatus) => orders.filter(o => o.status === s)
    const sum      = (list: typeof orders) => list.reduce((acc, o) => acc + o.totalSum, 0)
    return {
      new:       { count: byStatus('new').length,       total: sum(byStatus('new')) },
      modified:  { count: byStatus('modified').length,  total: sum(byStatus('modified')) },
      completed: { count: byStatus('completed').length, total: sum(byStatus('completed')) },
      cancelled: { count: byStatus('cancelled').length, total: sum(byStatus('cancelled')) },
    }
  }, [orders])

  const KPI_CARDS: { status: OrderStatus; labelKey: string }[] = [
    { status: 'new',       labelKey: 'orders_kpi_new' },
    { status: 'modified',  labelKey: 'orders_kpi_modified' },
    { status: 'completed', labelKey: 'orders_kpi_completed' },
    { status: 'cancelled', labelKey: 'orders_kpi_cancelled' },
  ]

  const allChecked = filteredOrders.length > 0 && filteredOrders.every(o => checked.includes(o.id))
  const toggleAll  = () => setChecked(allChecked ? [] : filteredOrders.map(o => o.id))
  const toggleOne  = (id: string) => setChecked(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900">

      {/* ── Шапка ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('orders_search_ph')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900">
              <input
                type="text"
                placeholder={t('orders_date_ph')}
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="border-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-300 dark:placeholder-gray-500"
                style={{ width: '21ch' }}
              />
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            </div>

            <button
              onClick={() => exportToExcel(filteredOrders, t)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:border-green-700 hover:bg-green-700"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-4 gap-3">
          {KPI_CARDS.map(({ status, labelKey }) => {
            const { count, total } = stats[status]
            const isActive = statusFilter === status
            return (
              <div
                key={status}
                onClick={() => setStatusFilter(isActive ? 'all' : status)}
                className={cn(
                  'flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all dark:bg-gray-800',
                  isActive ? 'border-gray-900 ring-1 ring-gray-900 dark:border-blue-400 dark:ring-blue-400' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t(labelKey)}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <p className="text-2xl font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100">
                    {count} <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{t('orders_kpi_pcs')}</span>
                  </p>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{formatCurrency(total)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Список ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        {filteredOrders.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="overflow-hidden border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full">
              <thead>
                <tr className="h-14 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="w-14 px-3 py-2.5 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-gray-900"
                    />
                  </th>
                  <th className="w-8 px-2 py-2.5 text-center text-xs font-semibold uppercase text-gray-400">#</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('orders_col_number')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400" style={{ minWidth: 160 }}>{t('orders_col_pharmacy')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400" style={{ minWidth: 160 }}>{t('orders_col_distributor')}</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('orders_col_positions')}</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('orders_col_qty')}</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('orders_col_sum')}</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('orders_col_date')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('orders_col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredOrders.map((order, idx) => {
                  const totalItems  = order.groups.reduce((s, g) => s + g.items.length, 0)
                  const isChecked   = checked.includes(order.id)
                  const hasProposal = order.groups.some(g => g.distributorStatus === 'offer')

                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        'h-14 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                        isChecked && 'bg-gray-50 dark:bg-gray-800',
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
                      <td className="px-2 py-2.5 text-center" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-xs text-gray-400">{idx + 1}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{order.number}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.pharmacyName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{order.pharmacyCity}</p>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        {order.groups.length === 1 ? (
                          <>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{order.groups[0].distributorName}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{order.groups[0].distributorCity}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('orders_n_distributors', { n: order.groups.length })}</p>
                            <p className="truncate text-xs text-gray-400 dark:text-gray-500" style={{ maxWidth: 180 }}>
                              {order.groups.map(g => g.distributorName).join(', ')}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{totalItems}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('orders_qty_n', { n: order.totalQty })}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.totalSum)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
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

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {checked.length > 0
                  ? t('orders_selected_n_of_m', { n: checked.length, m: filteredOrders.length })
                  : t('orders_shown_n_of_m', { n: filteredOrders.length, m: orders.length })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
