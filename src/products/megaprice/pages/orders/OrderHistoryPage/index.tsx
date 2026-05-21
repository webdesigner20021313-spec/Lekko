import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingOverlay } from '@/shared/ui-kit/LoadingOverlay'
import { Pagination } from '@/shared/ui-kit/Pagination'
import {
  usePurchases,
  usePurchaseStats,
  useDistributorsBatch,
  useDistributorsPaged,
  type DistributorFull,
} from '@/products/megaprice/api/hooks'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import {
  buildOrdersFromPurchases,
  mapPurchaseStatusToUi,
  mapUiStatusToPurchaseStatusIds,
} from '@/products/megaprice/pages/orders/adapters'
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ── Сырые «pending» значения, которые пользователь меняет в UI ──
  // На бэк уходят дебаунснутые версии (см. ниже), чтобы при быстром клике/печати
  // не было каскада запросов. Сам UI остаётся отзывчивым (input не лагает).
  const [search,       setSearch]       = useState('')
  const [dateRange,    setDateRange]    = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  // dd.MM.yyyy - dd.MM.yyyy → ISO yyyy-MM-dd для бэка.
  const parts        = dateRange.split(' - ')
  const dateFromISO  = parseDMYtoISO(parts[0]?.trim() ?? '') || null
  const dateToISO    = parseDMYtoISO(parts[1]?.trim() ?? '') || null

  // ── Один общий debounce на весь объект фильтров (300мс) ──
  // search, date-range, statusFilter мержим в один объект и дебаунсим целиком.
  // Это гарантирует, что:
  //   1) Печать в поле поиска не шлёт запрос на каждый символ.
  //   2) Быстрое последовательное переключение KPI-плиток (клик-клик-клик) тоже
  //      склеивается в один запрос на бэк.
  //   3) Все три запроса (purchases / stats / distributors-by-search) стартуют
  //      одновременно и снимают одну страницу состояния — без рассинхронизации.
  const pendingFilters = useMemo(
    () => ({ search, dateFromISO, dateToISO, statusFilter }),
    [search, dateFromISO, dateToISO, statusFilter],
  )
  const debouncedFilters = useDebouncedValue(pendingFilters, 300)
  const dSearch       = debouncedFilters.search
  const dDateFrom     = debouncedFilters.dateFromISO
  const dDateTo       = debouncedFilters.dateToISO
  const dStatusFilter = debouncedFilters.statusFilter

  // UI статус → бэковский int[]. 'accepted' маппится в []; передаём [-1],
  // чтобы бэк гарантированно вернул пусто (а не «снять фильтр»).
  const statusIds = useMemo<number[] | null>(() => {
    if (dStatusFilter === 'all') return null
    const ids = mapUiStatusToPurchaseStatusIds(dStatusFilter)
    return ids.length > 0 ? ids : [-1]
  }, [dStatusFilter])

  // ── Резолв дистров по search-строке ──────────────────────────────────────
  // Purchase-сервис не может ходить в DrugStoreCatalog за именами (DB-per-service),
  // поэтому если пользователь ввёл, например, «BAYER», мы ищем дистров с таким
  // именем сами и отдаём бэку их ids. Бэк OR'ит это с поиском по purchase_number/id.
  // Лимит 50 — больше точно не нужно, юзер всегда сузит запрос.
  const searchDistributorsQuery = useDistributorsPaged({
    query: dSearch,
    page: 1,
    pageSize: 50,
    drugStoreId: drugStore?.drugStoreId ?? null,
    enabled: dSearch.trim().length > 0,
  })
  const searchDistributorIds = useMemo<number[] | null>(() => {
    if (!dSearch.trim()) return null
    const items = searchDistributorsQuery.data?.items ?? []
    return items.length > 0 ? items.map(d => d.id) : null
  }, [dSearch, searchDistributorsQuery.data?.items])

  // Сбрасываем страницу в 1 при изменении любого фильтра.
  useEffect(() => {
    setPage(1)
  }, [dSearch, dDateFrom, dDateTo, dStatusFilter])

  const purchasesQuery = usePurchases({
    page,
    pageSize,
    hasPlacedOrders: true,
    search:    dSearch,
    dateFrom:  dDateFrom,
    dateTo:    dDateTo,
    statusIds,
    searchDistributorIds,
  })
  const apiPurchases = useMemo(() => purchasesQuery.data?.items ?? [], [purchasesQuery.data])
  const totalPages = purchasesQuery.data?.totalPages ?? 1
  const totalCount = purchasesQuery.data?.totalCount ?? 0
  const hasPrevious = purchasesQuery.data?.hasPrevious ?? false
  const hasNext = purchasesQuery.data?.hasNext ?? false

  // KPI: отдельный лёгкий endpoint /purchases/stats — без statusIds (плитки
  // должны показывать суммы по всем бакетам одновременно).
  const statsQuery = usePurchaseStats({
    hasPlacedOrders: true,
    search:   dSearch,
    dateFrom: dDateFrom,
    dateTo:   dDateTo,
    searchDistributorIds,
  })

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

  // Бэк уже отдал отфильтрованные/отсортированные/постранично. Фронт ничего
  // не фильтрует — просто маппит DTO → UI и рендерит.
  const orders: Order[] = useMemo(
    () => buildOrdersFromPurchases(apiPurchases, {
      pharmacyName: drugStore?.drugStoreName ?? null,
      pharmacyAddress: drugStore?.address ?? null,
      pharmacyCity: null,
      distributorNameById,
    }),
    [apiPurchases, drugStore, distributorNameById],
  )

  const [checked,      setChecked]      = useState<string[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calFrom,      setCalFrom]      = useState('')
  const [calTo,        setCalTo]        = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const hasFilters = search.trim().length > 0 || statusFilter !== 'all' || !!dateRange.trim()

  // Бэковский [{statusId, count, totalSum}] → UI Record<OrderStatus, ...>.
  // status_id 3/4/5 → 'completed' (см. mapPurchaseStatusToUi), 1→'new', 2→'modified',
  // 6→'cancelled', 7→'partial'. 'accepted' остаётся 0 — плитка осталась как заглушка.
  const stats = useMemo(() => {
    const empty = () => ({ count: 0, total: 0 })
    const acc: Record<OrderStatus, { count: number; total: number }> = {
      new: empty(), modified: empty(), accepted: empty(),
      completed: empty(), cancelled: empty(), partial: empty(),
    }
    // useQueryApiClient инициализирует data=[] но при первом маунте до ответа
    // может прилететь не-массив на race — защищаемся через Array.isArray.
    const rows = Array.isArray(statsQuery.data) ? statsQuery.data : []
    rows.forEach(r => {
      const ui = mapPurchaseStatusToUi(Number(r.statusId))
      acc[ui].count += Number(r.count) || 0
      acc[ui].total += Number(r.totalSum) || 0
    })
    return acc
  }, [statsQuery.data])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">

      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4 dark:border-gray-700 dark:bg-[#111111]">
        <MobileHeader
          search={search}
          setSearch={setSearch}
          hasFilters={hasFilters}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          onExport={() => exportToExcel(orders, t)}
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
          onExport={() => exportToExcel(orders, t)}
        />
      </div>

      <KpiCardsDesktop stats={stats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <StatusPillsMobile totalCount={totalCount} stats={stats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      <div className="relative min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#111111]">
        <LoadingOverlay show={purchasesQuery.isLoading} label="Загрузка заказов…" />
        {orders.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <OrderListMobile filteredOrders={orders} totalCount={totalCount} />
            <OrderTableDesktop
              filteredOrders={orders}
              totalCount={totalCount}
              checked={checked}
              setChecked={setChecked}
            />
          </>
        )}
      </div>

      {totalCount > 0 && (
        <div className="shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            isLoading={purchasesQuery.isLoading}
            onChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      )}

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
