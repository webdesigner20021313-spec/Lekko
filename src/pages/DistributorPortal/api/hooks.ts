import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

// ── DTO зеркало бекенда (ABU.Purchase.Application/DTOs/DistributorOrder) ────

export interface ApiDistributorOrder {
  id: number
  purchaseOrderId: number
  /** id "зонтика"-закупки (purchases.id) — нужен для accept/reject endpoints. */
  purchaseId: number
  distributorId: number
  drugStoreId: number
  statusId: number
  createDate: string
  updateDate: string | null
  comment: string | null
  itemsCount: number
  totalSum: number
}

export interface ApiDistributorOrderItem {
  id: number
  distributorOrderId: number
  /** Связь с client-копией. NULL если дистр добавил позицию сам. */
  purchaseOrderItemId: number | null
  drugId: number
  quantity: number
  confirmedQuantity: number | null
  price: number | null
  itemId: number | null
  producerId: number | null
  replacementDrugId: number | null
  isAdded: number     // 0|1
  isModified: number  // 0|1
  isRemoved: number   // 0|1
  createdAt: string
  modifiedAt: string | null
}

/** Статусы distributor_orders.status_id (см. DistributorOrderDtos.cs). */
export const DISTR_ORDER_STATUS = {
  pending: 10,
  modified: 11,
  approved: 12,
  rejected: 13,
  shipped: 14,
  delivered: 15,
} as const

// ── Auth кабинета дистрибьютора (cookie-JWT) ───────────────────────────────

export interface DistributorMe {
  id: number
  name: string | null
  regionId: number | null
  contacts: string | null
  emails: string | null
  emailForOrders: string | null
  note: string | null
}

export interface DistributorLoginInfo {
  id: number
  name: string | null
  login: string
  /** Все distributor_id под этим логином (филиалы). */
  distributorIds: number[]
}

/**
 * GET /api/auth/distributor/me — профиль залогиненного дистра + все его филиалы
 * (distributorIds из JWT). 401 если не вошёл.
 */
export function useDistributorMe() {
  return useQueryApiClient<{ distributor: DistributorMe; distributorIds: number[] }>({
    request: { url: '/api/auth/distributor/me', method: 'GET' },
  })
}

/** POST /api/auth/distributor/login — { login, password } → access-cookie. */
export function useDistributorLogin(onSuccess?: () => void, onError?: (m: string) => void) {
  return useQueryApiClient<{ distributor: DistributorLoginInfo }>({
    request: { url: '/api/auth/distributor/login', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (m) => onError?.(typeof m === 'string' ? m : 'Request failed'),
  })
}

/** POST /api/auth/distributor/logout — очистка cookie. */
export function useDistributorLogout(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/auth/distributor/logout', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

// ── Аналитика поиска (ClientInsights, /api/client-insights/searches) ───────
// Источник — легаси-таблица item_search_logs/_dt (1:1 с monolith log_drug_id_search),
// наполняется живым пайплайном DrugSearch → DrugSearchedIntegrationEvent → ClientInsights.

/** Агрегат поиска по препарату (ClientInsights SearchLogEntry). */
export interface SearchStatEntry {
  drugId: number
  /** Бэк отдаёт пусто — имя резолвим на фронте через drugs-enrichment. */
  drugName: string
  searchCount: number
  uniqueUsers: number
  firstSearchDate: string
  lastSearchDate: string
}

/**
 * GET /api/client-insights/searches?distributorIds=…&fromDate=&toDate= —
 * статистика поисков клиентов по всем филиалам дистра (агрегат по drug_id).
 * Возвращает плоский массив (не paged).
 */
export function useDistributorSearchStats(
  distributorIds: number[] | null,
  fromDate?: string,
  toDate?: string,
) {
  const ids = distributorIds ?? []
  return useQueryApiClient<SearchStatEntry[]>({
    request: {
      url: '/api/client-insights/searches',
      method: 'GET',
      params: { distributorIds: ids, fromDate: fromDate || undefined, toDate: toDate || undefined },
    },
    enabled: ids.length > 0,
  })
}

/** Активность по аптекам (ClientInsights ClientActivity). */
export interface PharmacyStatEntry {
  drugStoreId: number
  drugStoreName: string | null
  searchCount: number
  lastSearchDate: string | null
}

/** GET /api/client-insights/pharmacy-stats?distributorIds=… — агрегат по аптекам. */
export function useDistributorPharmacyStats(
  distributorIds: number[] | null,
  fromDate?: string,
  toDate?: string,
) {
  const ids = distributorIds ?? []
  return useQueryApiClient<PharmacyStatEntry[]>({
    request: {
      url: '/api/client-insights/pharmacy-stats',
      method: 'GET',
      params: { distributorIds: ids, fromDate: fromDate || undefined, toDate: toDate || undefined },
    },
    enabled: ids.length > 0,
  })
}

/** Строка ленты последних поисков (ClientInsights RecentSearch). */
export interface RecentSearchEntry {
  drugStoreId: number
  drugStoreName: string | null
  drugId: number
  drugName: string | null
  searchDate: string
}

/** GET /api/client-insights/recent?distributorIds=… — лента последних поисков. */
export function useDistributorRecentSearches(
  distributorIds: number[] | null,
  fromDate?: string,
  toDate?: string,
) {
  const ids = distributorIds ?? []
  return useQueryApiClient<RecentSearchEntry[]>({
    request: {
      url: '/api/client-insights/recent',
      method: 'GET',
      params: { distributorIds: ids, limit: 100, fromDate: fromDate || undefined, toDate: toDate || undefined },
    },
    enabled: ids.length > 0,
  })
}

// ── Справочник всех аптек (раздел «Мои аптеки») ────────────────────────────

export interface ApiDrugStoreFull {
  id: number
  name: string
  nameRu: string | null
  nameUz: string | null
  address: string | null
  phone: string | null
  email: string | null
  areaId: number | null
  statusId: number | null
}

interface DrugStoresPaged {
  items: ApiDrugStoreFull[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/** GET /api/drugstores?page=&pageSize= — пагинированный справочник всех аптек. */
export function useAllPharmacies(page: number, pageSize: number) {
  return useQueryApiClient<DrugStoresPaged>({
    request: {
      url: '/api/drugstores',
      method: 'GET',
      params: { page, pageSize },
    },
  })
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/**
 * GET /api/distributor-orders?statusId=… — заказы ВСЕХ моих филиалов.
 * Скоуп по distributorIds из JWT (бэк), без явного distributorId.
 */
export function useDistributorOrdersList(statusId?: number | null) {
  return useQueryApiClient<ApiDistributorOrder[]>({
    request: {
      url: '/api/distributor-orders',
      method: 'GET',
      params: statusId ? { statusId } : undefined,
    },
  })
}

/** GET /api/distributor-orders/{id} → { order, items }. */
export function useDistributorOrderDetail(orderId: number | null) {
  return useQueryApiClient<{ order: ApiDistributorOrder; items: ApiDistributorOrderItem[] }>({
    request: {
      url: `/api/distributor-orders/${orderId ?? 0}`,
      method: 'GET',
    },
    enabled: !!orderId,
  })
}

/** PUT /api/distributor-orders/items/{itemId} — qty/price/replacement. */
export function useUpdateItem(onSuccess?: () => void, onError?: (m: string) => void) {
  return useQueryApiClient({
    request: { url: '/api/distributor-orders/items/:itemId', method: 'PUT', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (m) => onError?.(typeof m === 'string' ? m : 'Request failed'),
  })
}

/** POST /api/distributor-orders/{id}/items — добавить позицию (is_added=1). */
export function useAddItem(onSuccess?: () => void, onError?: (m: string) => void) {
  return useQueryApiClient<{ id: number }>({
    request: { url: '/api/distributor-orders/:orderId/items', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (m) => onError?.(typeof m === 'string' ? m : 'Request failed'),
  })
}

/** DELETE /api/distributor-orders/items/{itemId} — soft-remove (is_removed=1). */
export function useRemoveItem(onSuccess?: () => void, onError?: (m: string) => void) {
  return useQueryApiClient({
    request: { url: '/api/distributor-orders/items/:itemId', method: 'DELETE', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (m) => onError?.(typeof m === 'string' ? m : 'Request failed'),
  })
}

/** PUT /api/distributor-orders/{id}/status — отправить клиенту на review или подтвердить отгрузку. */
export function useUpdateStatus(onSuccess?: () => void, onError?: (m: string) => void) {
  return useQueryApiClient({
    request: { url: '/api/distributor-orders/:orderId/status', method: 'PUT', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (m) => onError?.(typeof m === 'string' ? m : 'Request failed'),
  })
}

/**
 * POST /api/distributor-orders/{id}/accept — принять под-заказ.
 * Body: { purchaseId }. 10→12 (дистр сразу принимает) или 11→12 (аптека ревью).
 * После — recalc purchase.status + SignalR-нотификация в обе группы.
 */
export function useAcceptOrder(onSuccess?: () => void, onError?: (m: string) => void) {
  return useQueryApiClient({
    request: { url: '/api/distributor-orders/:orderId/accept', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (m) => onError?.(typeof m === 'string' ? m : 'Request failed'),
  })
}

/**
 * POST /api/distributor-orders/{id}/reject — отклонить под-заказ.
 * Body: { purchaseId }. 10→13 (дистр отказывается) или 11→13 (аптека отклонила изменения).
 * После — recalc purchase.status + SignalR.
 */
export function useRejectOrder(onSuccess?: () => void, onError?: (m: string) => void) {
  return useQueryApiClient({
    request: { url: '/api/distributor-orders/:orderId/reject', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
    onError: (m) => onError?.(typeof m === 'string' ? m : 'Request failed'),
  })
}

// ── Справочники для резолва id → имена ────────────────────────────────────

export interface ApiDistributorBrief {
  id: number
  name: string
  note: string | null   // часто содержит «г. Ташкент»
  address: string | null
  regionId: number | null
}

interface DistributorsPagedResponse {
  items: ApiDistributorBrief[]
  totalCount: number
}

/** GET /api/distributors?page=1&pageSize=1000 — все дистры разом для селекта. */
export function useDistributorsAll() {
  return useQueryApiClient<DistributorsPagedResponse>({
    request: {
      url: '/api/distributors',
      method: 'GET',
      params: { page: 1, pageSize: 1000 },
    },
  })
}

export interface ApiDrugStoreBrief {
  id: number
  name: string | null
  nameRu: string | null
  nameUz: string | null
  address: string | null
  phone: string | null
  email: string | null
}

/** POST /api/drugstores/batch — резолв id → имя/адрес для списка заказов. */
export function useDrugStoresBatch() {
  return useQueryApiClient<ApiDrugStoreBrief[]>({
    request: { url: '/api/drugstores/batch', method: 'POST', disableOnMount: true },
  })
}

export interface ApiDrugBrief {
  id: number
  fullName: string
  producerName: string | null
  countryName: string | null
}

/** POST /api/drugs/cart-enrichment — резолв drug_id → имя/производитель. */
export function useDrugsEnrichment() {
  return useQueryApiClient<ApiDrugBrief[]>({
    request: { url: '/api/drugs/cart-enrichment', method: 'POST', disableOnMount: true },
  })
}

// ── Ассортимент дистра — для select'ов «Замена» и «Добавить позицию» ───────

export interface ApiPriceItem {
  id: number
  priceListId: number
  drugId: number | null
  producerId: number | null
  producerVariantId: number | null
  /** parse_variants.id — для резолва drug_id через Matching. */
  variantId: number | null
  itemName: string
  producerName: string | null
  price: number
  quantity: number | null
  expireDate: string | null
  country: string | null
  barcode: string | null
  ikpuCode: string | null
  isLinked: boolean
  createdAt: string
}

export interface ApiVariantDrugMap {
  variantId: number
  drugId: number
}

/**
 * POST /api/matching/parse-variants/by-variants — резолв `variant_id → drug_id`.
 * Используется чтобы дополнить ItemPicker: backend Pricing хардкодит drugId=NULL,
 * реальная привязка к справочнику drugs идёт через parse_variants в Matching.
 */
export function useVariantsToDrugs() {
  return useQueryApiClient<ApiVariantDrugMap[]>({
    request: { url: '/api/matching/parse-variants/by-variants', method: 'POST', disableOnMount: true },
  })
}

interface PriceItemsPaged {
  items: ApiPriceItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/**
 * GET /api/pricing/distributor/{id}/items?search=...&page=...&pageSize=... —
 * ассортимент дистра (активные прайс-листы, items.status=3). С пагинацией.
 */
export function useDistributorAssortment(
  distributorId: number | null,
  search: string,
  page: number,
  pageSize: number,
) {
  return useQueryApiClient<PriceItemsPaged>({
    request: {
      url: `/api/pricing/distributor/${distributorId ?? 0}/items`,
      method: 'GET',
      params: { search: search || undefined, page, pageSize },
    },
    enabled: !!distributorId,
  })
}
