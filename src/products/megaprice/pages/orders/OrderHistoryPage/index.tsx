import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingOverlay } from '@/shared/ui-kit/LoadingOverlay'
import { usePurchases, useDistributorsBatch, type DistributorFull } from '@/products/megaprice/api/hooks'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { buildOrdersFromPurchases } from '@/products/megaprice/pages/orders/adapters'
import { type OrderStatus, type Order } from '@/products/megaprice/pages/orders/types'
import { DesktopHeader } from './DesktopHeader'
import { EmptyState } from './EmptyState'
import { KpiCardsDesktop } from './KpiCardsDesktop'
import { MobileFiltersSheet } from './MobileFiltersSheet'
import { MobileHeader } from './MobileHeader'
import { OrderListMobile } from './OrderListMobile'
import { OrderTableDesktop } from './OrderTableDesktop'
import { StatusPillsMobile } from './StatusPillsMobile'
import { exportToExcel, parseDMYtoISO } from './helpers'

export function OrderHistoryPage() {
  const { t } = useTranslation()

  // ── Real API: purchases с хотя бы одним placed order ──
  // Показываем закупки где есть хотя бы один placed order — это покрывает:
  //   1) Полностью оформленные (status_id=1, все orders placed)
  //   2) Partial place — purchase ещё активна (status_id=0), но 1+ orders placed.
  //      В таком случае cart покажет оставшиеся draft items в этой же purchase.
  const drugStore = useAuthStore(s => s.drugStore)
  const purchasesQuery = usePurchases({ page: 1, pageSize: 200, hasPlacedOrders: true })
  const apiPurchases = purchasesQuery.data?.items ?? []

  // Имена дистров — batch HTTP. Собираем все distinct ids из purchases (бэк
  // отдаёт массив per-purchase), и запрашиваем имена одним запросом.
  const distributorsBatch = useDistributorsBatch()
  const allDistributorIds = useMemo(() => {
    const set = new Set<number>()
    apiPurchases.forEach(p => p.distributorIds?.forEach(id => { if (id) set.add(id) }))
    return Array.from(set)
  }, [apiPurchases])

  // useEffect→appendData чтобы триггерить запрос только при смене набора id.
  // Stringified key, чтобы не циклиться на reference-неравенстве массива.
  const idsKey = useMemo(() => allDistributorIds.slice().sort((a, b) => a - b).join(','), [allDistributorIds])
  useEffect(() => {
    if (allDistributorIds.length === 0) return
    distributorsBatch.appendData({ ids: allDistributorIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  const distributorNameById = useMemo(() => {
    const m = new Map<number, string>()
    const list = (distributorsBatch.data as DistributorFull[] | undefined) ?? []
    list.forEach(d => m.set(d.id, d.name))
    return m
  }, [distributorsBatch.data])

  const orders: Order[] = useMemo(
    () => buildOrdersFromPurchases(apiPurchases, {
      pharmacyName: drugStore?.drugStoreName ?? null,
      pharmacyAddress: drugStore?.address ?? null,
      pharmacyCity: null,
      distributorNameById,
    }),
    [apiPurchases, drugStore, distributorNameById],
  )

  const [search,       setSearch]       = useState('')
  const [dateRange,    setDateRange]    = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [checked,      setChecked]      = useState<string[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calFrom,      setCalFrom]      = useState('')
  const [calTo,        setCalTo]        = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const parts        = dateRange.split(' - ')
  const dateFromISO  = parseDMYtoISO(parts[0]?.trim() ?? '')
  const dateToISO    = parseDMYtoISO(parts[1]?.trim() ?? '')

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
  }, [orders, search, statusFilter, dateFromISO, dateToISO])

  const hasFilters = search.trim().length > 0 || statusFilter !== 'all' || !!dateRange.trim()

  const stats = useMemo(() => {
    const byStatus = (s: OrderStatus) => orders.filter(o => o.status === s)
    const sum      = (list: typeof orders) => list.reduce((acc, o) => acc + o.totalSum, 0)
    // accepted считаем в общей completed-плитке (UX — заказы где клиент принял
    // и/или закрыл, в одну KPI). Если потом потребуется отдельная плитка
    // «Принято» — расщепить.
    const all: Record<OrderStatus, { count: number; total: number }> = {
      new:       { count: byStatus('new').length,       total: sum(byStatus('new')) },
      modified:  { count: byStatus('modified').length,  total: sum(byStatus('modified')) },
      accepted:  { count: byStatus('accepted').length,  total: sum(byStatus('accepted')) },
      completed: { count: byStatus('completed').length, total: sum(byStatus('completed')) },
      cancelled: { count: byStatus('cancelled').length, total: sum(byStatus('cancelled')) },
    }
    return all
  }, [orders])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">

      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4 dark:border-gray-700 dark:bg-[#111111]">
        <MobileHeader
          search={search}
          setSearch={setSearch}
          hasFilters={hasFilters}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          onExport={() => exportToExcel(filteredOrders, t)}
        />
        <DesktopHeader
          search={search}
          setSearch={setSearch}
          dateRange={dateRange}
          setDateRange={setDateRange}
          calFrom={calFrom}
          calTo={calTo}
          setCalFrom={setCalFrom}
          setCalTo={setCalTo}
          calendarOpen={calendarOpen}
          setCalendarOpen={setCalendarOpen}
          onExport={() => exportToExcel(filteredOrders, t)}
        />
      </div>

      <KpiCardsDesktop stats={stats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <StatusPillsMobile totalCount={orders.length} stats={stats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      <div className="relative min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#111111]">
        <LoadingOverlay show={purchasesQuery.isLoading} label="Загрузка заказов…" />
        {filteredOrders.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <OrderListMobile filteredOrders={filteredOrders} totalCount={orders.length} />
            <OrderTableDesktop
              filteredOrders={filteredOrders}
              totalCount={orders.length}
              checked={checked}
              setChecked={setChecked}
            />
          </>
        )}
      </div>

      <MobileFiltersSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        calFrom={calFrom}
        calTo={calTo}
        setCalFrom={setCalFrom}
        setCalTo={setCalTo}
        setDateRange={setDateRange}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stats={stats}
      />
    </div>
  )
}
