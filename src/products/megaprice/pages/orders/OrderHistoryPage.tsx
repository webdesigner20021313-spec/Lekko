import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Download, Calendar, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { useOrdersStore } from '@/products/megaprice/stores/useOrdersStore'
import { mp } from '@/products/megaprice/utils/path'
import {
  ORDER_STATUS_CONFIG,
  type OrderStatus,
} from '@/products/megaprice/pages/orders/types'

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, bg, text } = ORDER_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', bg, text)}>
      {label}
    </span>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
        <Package className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-900">
        {hasFilters ? 'Заказов не найдено' : 'Заказов пока нет'}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {hasFilters
          ? 'Попробуйте изменить фильтры или поисковый запрос'
          : 'Созданные заказы будут отображаться здесь'}
      </p>
    </div>
  )
}

// ─── Export helper ────────────────────────────────────────────────────────────

function exportToExcel(orders: import('@/products/megaprice/pages/orders/types').Order[]) {
  const rows = orders.map((o, i) => ({
    '№':        i + 1,
    'Номер':    o.number,
    'Аптека':   o.pharmacyName,
    'Город':    o.pharmacyCity,
    'Дистрибуторы': o.groups.map(g => g.distributorName).join(', '),
    'Позиций':  o.groups.reduce((s, g) => s + g.items.length, 0),
    'Кол-во':   o.totalQty,
    'Сумма':    o.totalSum,
    'Дата':     formatDate(o.createdAt),
    'Статус':   ORDER_STATUS_CONFIG[o.status].label,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Заказы')
  XLSX.writeFile(wb, 'Заказы.xlsx')
}

// ─── OrderHistoryPage ─────────────────────────────────────────────────────────

export function OrderHistoryPage() {
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

  const allChecked = filteredOrders.length > 0 && filteredOrders.every(o => checked.includes(o.id))
  const toggleAll  = () => setChecked(allChecked ? [] : filteredOrders.map(o => o.id))
  const toggleOne  = (id: string) => setChecked(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">

      {/* ── Шапка ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Поиск */}
            <div className="relative w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Номер, аптека, дистрибутор..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Дата-диапазон */}
            <div className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
              <input
                type="text"
                placeholder="дд.мм.гггг - дд.мм.гггг"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="border-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                style={{ width: '21ch' }}
              />
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            </div>

            {/* Excel */}
            <button
              onClick={() => exportToExcel(filteredOrders)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:border-green-700 hover:bg-green-700"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="grid grid-cols-4 gap-3">
          {([
            { status: 'new'       as OrderStatus, label: 'Новые' },
            { status: 'modified'  as OrderStatus, label: 'Изменено' },
            { status: 'completed' as OrderStatus, label: 'Завершённые' },
            { status: 'cancelled' as OrderStatus, label: 'Отменённые' },
          ] as const).map(({ status, label }) => {
            const { count, total } = stats[status]
            const isActive = statusFilter === status
            return (
              <div
                key={status}
                onClick={() => setStatusFilter(isActive ? 'all' : status)}
                className={cn(
                  'flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all',
                  isActive ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <p className="text-2xl font-bold tabular-nums leading-none text-gray-900">
                    {count} <span className="text-sm font-medium text-gray-400">шт.</span>
                  </p>
                  <p className="text-sm font-semibold text-gray-500">{formatCurrency(total)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Список ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {filteredOrders.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="overflow-hidden border-b border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="h-14 border-b border-gray-200 bg-gray-50">
                  <th className="w-14 px-3 py-2.5 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-gray-900"
                    />
                  </th>
                  <th className="w-8 px-2 py-2.5 text-center text-xs font-semibold uppercase text-gray-400">#</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Номер</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500" style={{ minWidth: 160 }}>Аптека</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500" style={{ minWidth: 160 }}>Дистрибутор</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-gray-500">Поз.</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-gray-500">Кол-во</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-gray-500">Сумма</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-gray-500">Дата</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order, idx) => {
                  const totalItems  = order.groups.reduce((s, g) => s + g.items.length, 0)
                  const isChecked   = checked.includes(order.id)
                  const hasProposal = order.groups.some(g => g.distributorStatus === 'offer')

                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        'h-14 cursor-pointer transition-colors hover:bg-gray-50',
                        isChecked && 'bg-gray-50',
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
                        <span className="font-mono text-sm font-semibold text-gray-900">{order.number}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <p className="text-sm font-medium text-gray-900">{order.pharmacyName}</p>
                        <p className="text-xs text-gray-400">{order.pharmacyCity}</p>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        {order.groups.length === 1 ? (
                          <>
                            <p className="text-sm text-gray-700">{order.groups[0].distributorName}</p>
                            <p className="text-xs text-gray-400">{order.groups[0].distributorCity}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-700">{order.groups.length} дистрибутора</p>
                            <p className="truncate text-xs text-gray-400" style={{ maxWidth: 180 }}>
                              {order.groups.map(g => g.distributorName).join(', ')}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm text-gray-600">{totalItems}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm text-gray-600">{order.totalQty} шт.</span>
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalSum)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={order.status} />
                          {hasProposal && (
                            <span title="Есть предложение от дистрибутора">
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

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
              <p className="text-xs text-gray-400">
                {checked.length > 0
                  ? `Выбрано ${checked.length} из ${filteredOrders.length}`
                  : `Показано ${filteredOrders.length} из ${orders.length} заказов`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
