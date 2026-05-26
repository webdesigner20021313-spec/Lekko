import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Download, Calendar, AlertCircle, ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { BottomSheet } from '@/shared/ui-kit/BottomSheet'
import { useMobileHeaderActions, useMobileHeaderSearch, type HeaderAction, type HeaderSearch } from '@/shared/stores/useMobileHeaderStore'
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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#222222]">
        <Package className="h-5 w-5 text-gray-400 dark:text-[#929292]" />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {hasFilters ? t('orders_no_results_title') : t('orders_empty_title')}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-[#929292]">
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISO(d: Date) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function applyDateMask(digits: string): string {
  const d = digits.slice(0, 16)
  let result = ''
  result += d.slice(0, 2)
  if (d.length > 2) result += '.' + d.slice(2, 4)
  if (d.length > 4) result += '.' + d.slice(4, 8)
  if (d.length > 8) result += ' - ' + d.slice(8, 10)
  if (d.length > 10) result += '.' + d.slice(10, 12)
  if (d.length > 12) result += '.' + d.slice(12, 16)
  return result
}

function parseDMYtoISO(dmy: string): string {
  const m = dmy.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return ''
  return `${m[3]}-${m[2]}-${m[1]}`
}

function ISOtoDMY(iso: string): string {
  if (!iso) return ''
  const [yyyy, mm, dd] = iso.split('-')
  return `${dd}.${mm}.${yyyy}`
}

// ─── RangeCalendar ────────────────────────────────────────────────────────────

function RangeCalendar({ from, to, onChange }: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const { t, i18n } = useTranslation()
  const today = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())
  const [hover, setHover] = useState('')

  const locale = i18n.language === 'uz' ? 'uz-Latn-UZ' : 'ru-RU'

  const MONTHS = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const s = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2025, i, 1))
      return s.charAt(0).toUpperCase() + s.slice(1)
    }), [locale])

  const DAYS = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const s = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2025, 0, 6 + i))
      return s.charAt(0).toUpperCase() + s.slice(1)
    }), [locale])

  const prevM = () => { if (vm === 0) { setVy(y => y - 1); setVm(11) } else setVm(m => m - 1) }
  const nextM = () => { if (vm === 11) { setVy(y => y + 1); setVm(0) } else setVm(m => m + 1) }

  const cells = useMemo(() => {
    const first = new Date(vy, vm, 1)
    const last  = new Date(vy, vm + 1, 0)
    const pad   = (first.getDay() + 6) % 7
    const arr: (Date | null)[] = Array(pad).fill(null)
    for (let d = 1; d <= last.getDate(); d++) arr.push(new Date(vy, vm, d))
    return arr
  }, [vy, vm])

  function handleClick(date: Date) {
    const iso = toISO(date)
    if (!from || (from && to)) onChange(iso, '')
    else if (iso >= from) onChange(from, iso)
    else onChange(iso, from)
  }

  const todayISO = toISO(today)

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={prevM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
        </button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{MONTHS[vm]} {vy}</span>
        <button onClick={nextM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-[#929292]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const iso = toISO(date)
          const end = to || hover
          const lo  = from && end ? (from <= end ? from : end) : from
          const hi  = from && end ? (from <= end ? end  : from) : ''
          const isF = iso === from
          const isT = iso === (to || (from && hover ? hover : ''))
          const inR = !!lo && !!hi && iso > lo && iso < hi
          const isTod = iso === todayISO
          return (
            <button key={iso}
              onClick={() => handleClick(date)}
              onMouseEnter={() => { if (from && !to) setHover(iso) }}
              onMouseLeave={() => setHover('')}
              className={cn(
                'h-7 w-full text-xs transition-colors',
                (isF || isT)
                  ? 'rounded-full bg-gray-900 font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900'
                  : inR
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  : cn('rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700', isTod && 'font-bold'),
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-[#929292]">
        {!from ? t('orders_cal_pick_start') : !to ? t('orders_cal_pick_end') : `${ISOtoDMY(from)} — ${ISOtoDMY(to)}`}
      </p>
    </div>
  )
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
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calFrom,      setCalFrom]      = useState('')
  const [calTo,        setCalTo]        = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!calendarOpen) return
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [calendarOpen])


  const parts      = dateRange.split(' - ')
  const dateFromISO = parseDMYtoISO(parts[0]?.trim() ?? '')
  const dateToISO   = parseDMYtoISO(parts[1]?.trim() ?? '')

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
        if (dateFromISO && o.createdAt.slice(0, 10) < dateFromISO) return false
        if (dateToISO   && o.createdAt.slice(0, 10) > dateToISO)   return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [search, statusFilter, dateFromISO, dateToISO])

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

  // Иконка-фильтр в header'е активна только если выбран фильтр из bottom-sheet'а
  // (статус или дата). Поиск — отдельный UI, его наличие не подсвечивает фильтр.
  const sheetFiltersActive = statusFilter !== 'all' || !!dateRange.trim()
  const headerActions = useMemo<HeaderAction[]>(() => [
    {
      id: 'filters',
      icon: SlidersHorizontal,
      onClick: () => setMobileFiltersOpen(true),
      ariaLabel: t('orders_filters'),
      variant: sheetFiltersActive ? 'active' : 'default',
      indicator: sheetFiltersActive,
    },
  ], [sheetFiltersActive, t])
  useMobileHeaderActions(headerActions)

  // Поиск в мобильном header'е (лупа → раскрывается на всю ширину).
  const headerSearch = useMemo<HeaderSearch>(() => ({
    value: search,
    onChange: setSearch,
    placeholder: t('orders_search_ph'),
  }), [search, t])
  useMobileHeaderSearch(headerSearch)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#090909]">

      {/* ── Шапка ── */}
      <div className="hidden shrink-0 border-b border-gray-200 bg-white md:block md:px-6 md:py-4 dark:border-gray-700 dark:bg-[#090909]">
        {/* Mobile: поиск/фильтр/Excel — всё перенесено в шапку приложения через useMobileHeader* */}

        {/* Desktop header */}
        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-3">
          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative flex-1 md:w-60 md:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('orders_search_ph')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:border-gray-700 dark:bg-[#090909] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 md:ml-auto">
            <div className="relative" ref={calendarRef}>
              <div className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-[#090909]">
                <input
                  type="text"
                  placeholder={t('orders_date_ph')}
                  value={dateRange}
                  onChange={e => setDateRange(applyDateMask(e.target.value.replace(/\D/g, '')))}
                  className="border-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-300 dark:placeholder-gray-500"
                  style={{ width: '21ch' }}
                />
                {dateRange && (
                  <button
                    type="button"
                    onClick={() => { setDateRange(''); setCalFrom(''); setCalTo('') }}
                    className="flex shrink-0 items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCalendarOpen(v => !v)}
                  className="flex shrink-0 items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>

              {calendarOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-[#222222]">
                  <RangeCalendar
                    from={calFrom}
                    to={calTo}
                    onChange={(f, to) => {
                      setCalFrom(f)
                      setCalTo(to)
                      if (f && to) {
                        setDateRange(`${ISOtoDMY(f)} - ${ISOtoDMY(to)}`)
                        setCalendarOpen(false)
                      } else {
                        setDateRange(f ? ISOtoDMY(f) : '')
                      }
                    }}
                  />
                  {(calFrom || calTo) && (
                    <button
                      type="button"
                      onClick={() => { setCalFrom(''); setCalTo(''); setDateRange(''); setCalendarOpen(false) }}
                      className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {t('orders_date_clear')}
                    </button>
                  )}
                </div>
              )}
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

      {/* ── KPI Cards (desktop only — горизонтальный grid) ── */}
      <div className="hidden md:block shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-[#090909]">
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

      {/* ── KPI Status pills (mobile only — компактные таблетки-фильтры) ── */}
      <div className="md:hidden shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#090909]">
        <div className="flex gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
              statusFilter === 'all'
                ? 'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900'
                : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-[#090909] dark:text-gray-400',
            )}
          >
            {t('orders_filter_all')}
            <span className="tabular-nums opacity-70">{orders.length}</span>
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
                    : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-[#090909] dark:text-gray-400',
                )}
              >
                {t(labelKey)}
                <span className="tabular-nums opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Список ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#090909]">
        {filteredOrders.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
          {/* Mobile cards — отдельные карточки на фоне страницы. min-h-full чтобы серый фон тянулся на всю высоту, даже когда заказов мало. */}
          <div className="md:hidden min-h-full space-y-2 bg-gray-50 p-3 dark:bg-[#0a0a0a]">
            {filteredOrders.map((order) => {
              const totalItems  = order.groups.reduce((s, g) => s + g.items.length, 0)
              const hasProposal = order.groups.some(g => g.distributorStatus === 'offer')
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(mp(`/orders/${order.id}`))}
                  className="flex w-full flex-col rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:border-[#262626] dark:bg-[#171717] dark:active:bg-[#222222]"
                >
                  <div className="flex w-full items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{order.pharmacyName}</span>
                      <p className="mt-0.5 text-xs tabular-nums text-gray-500 dark:text-[#929292]">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(order.totalSum)}</span>
                    </div>
                  </div>
                  <div className="my-2.5 h-px w-full bg-gray-100 dark:bg-[#262626]" />
                  <p className="w-full truncate text-sm text-gray-500 dark:text-[#929292]">
                    <span>{order.number}</span>
                    {' / '}{totalItems} {t('orders_pos_short')}
                    {' / '}{t('orders_qty_n', { n: order.totalQty })}
                  </p>
                </button>
              )
            })}
            <p className="pt-1 text-center text-xs text-gray-400 dark:text-[#929292]">
              {t('orders_shown_n_of_m', { n: filteredOrders.length, m: orders.length })}
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#090909]">
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
                  const totalItems  = order.groups.reduce((s, g) => s + g.items.length, 0)
                  const isChecked   = checked.includes(order.id)
                  const hasProposal = order.groups.some(g => g.distributorStatus === 'offer')

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
                      <td className="px-2 py-2.5 text-center" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="text-xs text-gray-400">{idx + 1}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{order.number}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.pharmacyName}</p>
                        <p className="text-xs text-gray-400 dark:text-[#929292]">{order.pharmacyCity}</p>
                      </td>
                      <td className="px-3 py-2.5" onClick={() => navigate(mp(`/orders/${order.id}`))}>
                        {order.groups.length === 1 ? (
                          <>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{order.groups[0].distributorName}</p>
                            <p className="text-xs text-gray-400 dark:text-[#929292]">{order.groups[0].distributorCity}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('orders_n_distributors', { n: order.groups.length })}</p>
                            <p className="truncate text-xs text-gray-400 dark:text-[#929292]" style={{ maxWidth: 180 }}>
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
                        <span className="text-sm text-gray-500 dark:text-[#929292]">{formatDate(order.createdAt)}</span>
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

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-[#333333] dark:bg-[#222222]">
              <p className="text-xs text-gray-400 dark:text-[#929292]">
                {checked.length > 0
                  ? t('orders_selected_n_of_m', { n: checked.length, m: filteredOrders.length })
                  : t('orders_shown_n_of_m', { n: filteredOrders.length, m: orders.length })}
              </p>
            </div>
          </div>
          </>
        )}
      </div>

      <BottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
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
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-red-600 bg-transparent text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {t('orders_date_clear')}
            </button>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900"
            >
              {t('orders_apply')}
            </button>
          </div>
        }
      >
        <div className="px-5 py-4 pb-8">
          <div className="pb-5">
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

          {/* Разделитель между секциями */}
          <div className="-mx-5 border-t border-gray-200 dark:border-[#262626]" />

          <div className="pt-5">
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
                        : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#090909] dark:text-gray-300',
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
    </div>
  )
}
