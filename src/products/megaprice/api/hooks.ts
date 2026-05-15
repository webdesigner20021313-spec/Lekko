/**
 * Хуки Megaprice — все backend-вызовы продукта в одном месте.
 *
 * Каждый — тонкая обёртка над useQueryApiClient (единственный примитив).
 * Возвращают { data, isLoading, isSuccess, isError, refetch, appendData }.
 *
 *  - GET: стартует на mount, пагинация/фильтры через `params`.
 *  - не-GET: `disableOnMount: true`, триггер вручную через `appendData`.
 */
import { useEffect } from 'react'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import { refetchCart, useCartStore } from '@/products/megaprice/stores/useCartStore'
import type {
  DrugSearchRow,
  PagedResponse,
  PriceOffer,
  ProducerRef,
  SubstanceRef,
} from '@/shared/api/types'

// ── DrugSearch ──────────────────────────────────────────────────────────────

/**
 * POST /api/drugsearch/search — поиск каталога.
 * Стартует на mount (enableOnMount), пере-запросится при смене любого пропса.
 */
export function useDrugSearch(opts: {
  drugStoreId: number | null
  drugName: string
  substanceId?: number | null
  producerIds?: number[] | null
  countryId?: number | null
  showProducers?: boolean
  favoritesOnly?: boolean
  page?: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQueryApiClient<PagedResponse<DrugSearchRow>>({
    request: {
      url: '/api/drugsearch/search',
      method: 'POST',
      data: {
        drugStoreId: opts.drugStoreId,
        drugName: opts.drugName,
        substanceId: opts.substanceId ?? undefined,
        producerIds: opts.producerIds && opts.producerIds.length > 0 ? opts.producerIds : undefined,
        countryId: opts.countryId ?? undefined,
        showProducers: opts.showProducers ?? false,
        favoritesOnly: opts.favoritesOnly ?? false,
      },
      params: { page: opts.page ?? 1, pageSize: opts.pageSize ?? 30 },
      enableOnMount: true,
    },
    enabled: (opts.enabled ?? true) && !!opts.drugStoreId,
  })
}

/** GET /api/drugsearch/search/by-drug-id/{id} — все офферы одного drug. */
export function useOffersByDrugId(drugId: number | null | undefined, opts: {
  page?: number
  pageSize?: number
  priceAgeDays?: number
  distributorIds?: number[]
  regionIds?: number[]
} = {}) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<PagedResponse<PriceOffer>>({
    request: {
      url: `/api/drugsearch/search/by-drug-id/${drugId ?? 0}`,
      method: 'GET',
      params: {
        drugStoreId,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
        priceAgeDays: opts.priceAgeDays,
        distributorIds: opts.distributorIds && opts.distributorIds.length > 0 ? opts.distributorIds : undefined,
        regionIds: opts.regionIds && opts.regionIds.length > 0 ? opts.regionIds : undefined,
      },
      // Офферы кэшируем на 60с — переключение туда-обратно между препаратами
      // не дёргает бэк (тяжёлый запрос: ~250-700ms на 100+ дистрах).
      // Внутри 60с — мгновенный синхронный return cached. refetch() форсит fresh.
      staleTimeMs: 60_000,
    },
    enabled: !!drugStoreId && !!drugId,
  })
}

/** GET /api/drugsearch/price-lists/{id}/items — прайс-лист дистрибьютора. */
export function useDistributorPriceItems(distributorId: number | null | undefined, opts: {
  page?: number
  pageSize?: number
} = {}) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<PagedResponse<PriceOffer>>({
    request: {
      url: `/api/drugsearch/price-lists/${distributorId ?? 0}/items`,
      method: 'GET',
      params: { drugStoreId, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 },
    },
    enabled: !!drugStoreId && !!distributorId,
  })
}

// ── Reference (МНН, производители, дистрибьюторы, регионы) ──────────────────

export function useSubstances(query: string, opts: { drugId?: number; pageSize?: number } = {}) {
  return useQueryApiClient<SubstanceRef[] | PagedResponse<SubstanceRef>>({
    request: {
      url: '/api/drugsearch/reference/substances',
      method: 'GET',
      params: {
        query: query.trim() || undefined,
        drugId: opts.drugId,
        page: 1,
        pageSize: opts.pageSize ?? 50,
      },
    },
  })
}

/** GET /api/producers — paged + search производителей. */
export function useProducersPaged(opts: { query: string; page?: number; pageSize?: number; enabled?: boolean }) {
  return useQueryApiClient<PagedResponse<ProducerRef>>({
    request: {
      url: '/api/producers',
      method: 'GET',
      params: {
        search: opts.query.trim() || undefined,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
      },
    },
    enabled: opts.enabled ?? true,
  })
}

export interface DistributorRef {
  id: number
  name: string
  regionId?: number
  regionName?: string | null
  statusId?: number
  isOfficial?: boolean
  licenseDate?: string | null
  lastPriceDate?: string | null
}

/** GET /api/drugsearch/reference/distributors/paged — paged дистрибьюторы. */
export function useDistributorsPaged(opts: {
  query: string
  page?: number
  pageSize?: number
  drugStoreId?: number | null
  regionIds?: number[] | null
  favoritesOnly?: boolean
  priceAgeDays?: number | null
  enabled?: boolean
}) {
  return useQueryApiClient<{
    items: DistributorRef[]
    totalCount: number
    page: number
    pageSize: number
  }>({
    request: {
      url: '/api/drugsearch/reference/distributors/paged',
      method: 'GET',
      params: {
        search: opts.query.trim() || undefined,
        drugStoreId: opts.drugStoreId ?? undefined,
        regionIds: opts.regionIds && opts.regionIds.length > 0 ? opts.regionIds : undefined,
        favoritesOnly: opts.favoritesOnly || undefined,
        priceAgeDays: opts.priceAgeDays ?? undefined,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
      },
    },
    enabled: opts.enabled ?? true,
  })
}

export interface RegionRef {
  id: number
  nameRu: string | null
  nameUz?: string | null
  shortNameRu?: string | null
  countryId?: number
}

/** GET /api/regions — справочник регионов с поиском. */
export function useRegions(opts: { query?: string; enabled?: boolean } = {}) {
  return useQueryApiClient<RegionRef[]>({
    request: {
      url: '/api/regions',
      method: 'GET',
      params: { search: (opts.query ?? '').trim() || undefined },
    },
    enabled: opts.enabled ?? true,
  })
}

// ── Cart ────────────────────────────────────────────────────────────────────
//
// Все хуки cart'а работают с ОДНИМ shared store (useCartStore):
//   - useCart() — читает state, делает refetch при изменении drugStoreId
//   - useAddToCart / useUpdateCartQty / useRemoveFromCart — мутации, после
//     успеха вызывают refetchCart(), и ВСЕ потребители useCart обновляются.
//
// Параметр onSuccess в мутациях оставлен для обратной совместимости (cart.refetch),
// но сам по себе refetchCart() уже вызывается — onSuccess можно просто опускать.

/** Текущая корзина. Подписывается на shared store; refetch при смене drugStoreId. */
export function useCart() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  const data = useCartStore((s) => s.data)
  const isLoading = useCartStore((s) => s.isLoading)
  const refetch = useCartStore((s) => s.refetch)
  const setDrugStoreId = useCartStore((s) => s.setDrugStoreId)

  useEffect(() => {
    setDrugStoreId(drugStoreId)
    if (drugStoreId) void refetch()
  }, [drugStoreId, setDrugStoreId, refetch])

  return { data, isLoading, refetch }
}

/**
 * POST /api/cart/items — добавить позицию. После успеха shared cart обновляется.
 *   const { appendData: addToCart } = useAddToCart()
 *   addToCart({ drugStoreId, drugId, distributorId, priceId, price, quantity })
 */
export function useAddToCart(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/cart/items', method: 'POST', disableOnMount: true },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}

/** PUT /api/cart/items/:id — изменить qty. */
export function useUpdateCartQty(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/cart/items/:id', method: 'PUT', disableOnMount: true },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}

/** DELETE /api/cart/items/:id — удалить позицию. */
export function useRemoveFromCart(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/cart/items/:id', method: 'DELETE', disableOnMount: true },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}

/** DELETE /api/cart — очистить корзину. */
export function useClearCart(onSuccess?: () => void) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient({
    request: {
      url: '/api/cart',
      method: 'DELETE',
      params: { drugStoreId },
      disableOnMount: true,
    },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}

// ── Favorite drugs ──────────────────────────────────────────────────────────

export function useFavoriteDrugIds() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<number[]>({
    request: {
      url: '/api/drugsearch/favorites/drugs',
      method: 'GET',
      params: { drugStoreId },
    },
    enabled: !!drugStoreId,
  })
}

export function useAddFavoriteDrug(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/drugsearch/favorites/drugs', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

export function useRemoveFavoriteDrug(onSuccess?: () => void) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient({
    request: {
      url: '/api/drugsearch/favorites/drugs/:id',
      method: 'DELETE',
      params: { drugStoreId },
      disableOnMount: true,
    },
    onSuccess: () => onSuccess?.(),
  })
}

// ── Batch enrichment (для cart-page) ────────────────────────────────────────

export function useDrugsBatch() {
  return useQueryApiClient<{ id: number; fullName: string }[]>({
    request: { url: '/api/drugs/batch', method: 'POST', disableOnMount: true },
  })
}

/**
 * POST /api/drugs/cart-enrichment — узкая проекция для cart-карточек:
 * id, fullName, doza, quantity, producerName, countryName, inn.
 * Эти поля нужны cart-row'ам для отображения «производитель + страна».
 * /api/drugs/batch возвращает голое drug-entity без producer/country.
 */
export interface DrugCartEnrichment {
  id: number
  fullName: string
  doza: string | null
  quantity: number
  producerName: string | null
  countryName: string | null
  inn: string | null
}

export function useDrugsCartEnrichment() {
  return useQueryApiClient<DrugCartEnrichment[]>({
    request: { url: '/api/drugs/cart-enrichment', method: 'POST', disableOnMount: true },
  })
}

export interface DistributorFull {
  id: number
  name: string
  /** Реальный phone обычно null; контактный номер хранится в `contacts`. */
  phone: string | null
  contacts: string | null
  email: string | null
  emails: string | null
  emailForOrders: string | null
  telegramIdFirst: number | null
  telegramIdSecond: number | null
  inn: string | null
  minOrderAmount: number | null
  deliveryDays: number | null
  workingHours: string | null
  /** Часто содержит «г.Ташкент» — fallback для city. */
  note: string | null
  address: string | null
  regionId: number | null
  isOfficial: number
}

export function useDistributorsBatch() {
  return useQueryApiClient<DistributorFull[]>({
    request: { url: '/api/distributors/batch', method: 'POST', disableOnMount: true },
  })
}

// ── Personal discounts (per-distributor) ────────────────────────────────────

export interface ApiPersonalDiscount {
  drugStoreId: number
  distributorId: number
  discountPercent: number
  inn?: string | null
  payDeferment?: number | null
  bonus?: number | null
  prepayPercent?: number | null
  blockDate?: string | null
  defermentPayBonus?: number | null
}

/** GET /api/drugsearch/personal-discounts?drugStoreId=N */
export function usePersonalDiscounts() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<ApiPersonalDiscount[]>({
    request: {
      url: '/api/drugsearch/personal-discounts',
      method: 'GET',
      params: { drugStoreId },
    },
    enabled: !!drugStoreId,
  })
}

/** POST /api/drugsearch/personal-discounts — upsert скидки (idempotent). */
export function useSavePersonalDiscount(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/drugsearch/personal-discounts', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

/** DELETE /api/drugsearch/personal-discounts?drugStoreId=N&distributorId=M */
export function useDeletePersonalDiscount(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/drugsearch/personal-discounts', method: 'DELETE', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

// ── Purchase orders ─────────────────────────────────────────────────────────

export interface ApiPurchaseOrder {
  id: number
  variantId: number
  distributorId: number
  statusId: number
  createDate: string
  withDiscount: number
  syncId: number
  distributorName: string | null
  statusName: string | null
  variantTypeId: number
  totalSum: number
  itemCount: number
}

export interface ApiOrderStatus {
  id: number
  name: string
  description: string | null
}

export interface ApiPurchaseOrderItem {
  id: number
  orderId: number
  drugId: number
  productName: string | null
  quantity: number
  price: number
  producerId: number | null
  /** Любые поля бэк-DTO которые могут пригодиться UI. Доступны через `it as any` без типизации. */
  [key: string]: unknown
}

/** GET /api/purchaseorders — paged список заказов аптеки. */
export function useOrders(opts: {
  page?: number
  pageSize?: number
  distributorId?: number
  statusId?: number
  variantTypeId?: number
} = {}) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<PagedResponse<ApiPurchaseOrder>>({
    request: {
      url: '/api/purchaseorders',
      method: 'GET',
      params: {
        drugStoreId,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
        distributorId: opts.distributorId,
        statusId: opts.statusId,
        variantTypeId: opts.variantTypeId,
      },
    },
    enabled: !!drugStoreId,
  })
}

/** GET /api/purchaseorders/statuses — справочник статусов. Меняется почти никогда. */
export function useOrderStatuses() {
  return useQueryApiClient<ApiOrderStatus[]>({
    request: {
      url: '/api/purchaseorders/statuses',
      method: 'GET',
      staleTimeMs: 10 * 60_000, // 10 минут
    },
  })
}

/** GET /api/purchaseorders/{id} */
export function useOrderById(orderId: number | null | undefined) {
  return useQueryApiClient<ApiPurchaseOrder>({
    request: {
      url: `/api/purchaseorders/${orderId ?? 0}`,
      method: 'GET',
    },
    enabled: !!orderId,
  })
}

/** GET /api/purchaseorders/{id}/items */
export function useOrderItems(orderId: number | null | undefined) {
  return useQueryApiClient<ApiPurchaseOrderItem[]>({
    request: {
      url: `/api/purchaseorders/${orderId ?? 0}/items`,
      method: 'GET',
    },
    enabled: !!orderId,
  })
}

// ── Purchases (закупки = одна сессия checkout, содержит variants→orders→items) ─

export interface ApiPurchase {
  id: number
  drugStoreId: number
  purchaseNumber: string
  statusId: number
  createDate: string
  updateDate: string
  /** Денормализованные агрегаты из GetPurchasesPaged. */
  totalSum: number
  /** Число строк (COUNT(poi.id)). */
  itemCount: number
  /** Сумма quantity по всем позициям. */
  totalQty: number
  orderCount: number
  /** Кол-во orders уже placed (status_id > 0). Используется UI чтобы показывать
   * закупки с partial-placement (даже если purchase ещё статус=0). */
  placedOrderCount: number
  /** Distinct distributor_ids закупки — для обогащения имён через /api/distributors/batch. */
  distributorIds: number[]
}

/**
 * GET /api/purchases?drugStoreId=&page=&pageSize=&statusId=
 * statusId=null — все закупки; statusId=0 — только активная корзина;
 * statusId=1 — оформленные (для /orders).
 */
export function usePurchases(opts: {
  page?: number
  pageSize?: number
  statusId?: number | null
  /** true = только покупки с placed orders (для /orders); false = только чистый draft. */
  hasPlacedOrders?: boolean | null
} = {}) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<PagedResponse<ApiPurchase>>({
    request: {
      url: '/api/purchases',
      method: 'GET',
      params: {
        drugStoreId,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
        statusId: opts.statusId ?? undefined,
        hasPlacedOrders: opts.hasPlacedOrders ?? undefined,
      },
    },
    enabled: !!drugStoreId,
  })
}

/** GET /api/purchases/{id} — одна закупка (без orders/items, они отдельно). */
export function usePurchaseById(purchaseId: number | null | undefined) {
  return useQueryApiClient<ApiPurchase>({
    request: {
      url: `/api/purchases/${purchaseId ?? 0}`,
      method: 'GET',
    },
    enabled: !!purchaseId,
  })
}

/** GET /api/purchases/{id}/detail — закупка + все orders + все items одним вызовом. */
export function usePurchaseDetail(purchaseId: number | null | undefined) {
  return useQueryApiClient<{
    purchase: ApiPurchase
    orders: ApiPurchaseOrder[]
    items: ApiPurchaseOrderItem[]
  }>({
    request: {
      url: `/api/purchases/${purchaseId ?? 0}/detail`,
      method: 'GET',
    },
    enabled: !!purchaseId,
  })
}

/**
 * PUT /api/purchases/:id/status — поменять статус закупки.
 *   const close = useChangePurchaseStatus()
 *   close.appendData({ statusId: 1 }, { id: purchaseId })
 * После checkout (0 → 1) корзина автоматически пустеет — refetchCart в onSuccess.
 */
export function useChangePurchaseStatus(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/purchases/:id/status', method: 'PUT', disableOnMount: true },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}

/**
 * POST /api/purchases/place-orders — оформить выбранные позиции корзины как
 * НОВУЮ snapshot-закупку. Каждый клик «Оформить» = отдельная закупка.
 *   const place = usePlaceOrders()
 *   place.appendData({ drugStoreId, cartItemIds: [42, 51] })  // purchase_items.id
 *
 * Бэк: группирует cart-items по дистру → создаёт purchases (status=1)
 * + purchase_orders/items (клиент-копия, status=10) + distributor_orders/items
 * (зеркало для дистра, status=10 pending_distr) → удаляет placed cart-items.
 */
export function usePlaceOrders(onSuccess?: () => void) {
  return useQueryApiClient<{ id: number; number: string; movedCount: number }>({
    request: { url: '/api/purchases/place-orders', method: 'POST', disableOnMount: true },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}

/**
 * PUT /api/purchaseorders/:id/status — сменить статус заказа.
 * Используется для checkout'а из корзины (0 → 10 pending_distr).
 *   placeOrder.appendData({ statusId: 10 }, { id: orderId })
 * После успеха автоматически refetchCart — корзина опустеет (draft-заказы покинут "active" purchase).
 */
export function useChangeOrderStatus(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/purchaseorders/:id/status', method: 'PUT', disableOnMount: true },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}

export type { AddCartItemDto } from '@/shared/api/types'

// ─── Phase 5: Diff между client-копией и distributor-копией ────────────

export interface ApiDistributorOrder {
  id: number
  purchaseOrderId: number
  distributorId: number
  drugStoreId: number
  statusId: number
  createDate: string
  updateDate: string | null
  comment: string | null
}

export interface ApiDistributorOrderItem {
  id: number
  distributorOrderId: number
  purchaseOrderItemId: number | null
  drugId: number
  quantity: number
  confirmedQuantity: number | null
  price: number | null
  itemId: number | null
  producerId: number | null
  replacementDrugId: number | null
  isAdded: number
  isModified: number
  isRemoved: number
  createdAt: string
  modifiedAt: string | null
}

export interface PurchaseDiffResponse {
  purchase: ApiPurchase
  client:      { orders: ApiPurchaseOrder[]; items: ApiPurchaseOrderItem[] }
  distributor: { orders: ApiDistributorOrder[]; items: ApiDistributorOrderItem[] }
}

/**
 * GET /api/purchases/:id/diff — сравнить клиент-копию snapshot-закупки с
 * distributor-копией. Используется на странице /orders/:id для diff-rendering.
 */
export function usePurchaseDiff(purchaseId: number | null | undefined) {
  return useQueryApiClient<PurchaseDiffResponse>({
    request: { url: `/api/purchases/${purchaseId ?? 0}/diff`, method: 'GET' },
    enabled: !!purchaseId,
  })
}

/**
 * PUT /api/purchases/:id/accept — клиент акцептит изменения ВСЕХ дистров сразу.
 * Бэк копирует distributor_order_items → purchase_order_items, status=12 approved
 * для всех distributor_orders. Используется как «accept all» (если оставлю где-то).
 */
export function useAcceptDiff(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/purchases/:id/accept', method: 'PUT', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

/**
 * PUT /api/purchases/:id/reject — клиент отказывается от всех дистров сразу.
 */
export function useRejectDiff(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/purchases/:id/reject', method: 'PUT', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

/**
 * PUT /api/purchases/:id/distributor-orders/:distrOrderId/accept —
 * per-distributor accept. Меняет только этот distributor_order + соответствующий
 * purchase_order на 12 approved. purchases.status_id пересчитывается по
 * совокупности всех distributor_orders.
 */
export function useAcceptOneDistributor(onSuccess?: () => void) {
  return useQueryApiClient({
    request: {
      url: '/api/purchases/:id/distributor-orders/:distrOrderId/accept',
      method: 'PUT',
      disableOnMount: true,
    },
    onSuccess: () => onSuccess?.(),
  })
}

/**
 * PUT /api/purchases/:id/distributor-orders/:distrOrderId/reject — per-distributor
 * reject. Используется и кнопкой «Отклонить» в diff-секции, и пунктом «Отменить
 * заказ» в 3-точечном меню карточки.
 */
export function useRejectOneDistributor(onSuccess?: () => void) {
  return useQueryApiClient({
    request: {
      url: '/api/purchases/:id/distributor-orders/:distrOrderId/reject',
      method: 'PUT',
      disableOnMount: true,
    },
    onSuccess: () => onSuccess?.(),
  })
}

// ─── История изменений distributor_order ──────────────────────────────────

export interface ApiOrderHistoryEntry {
  itemId: number
  /** 'quantity' | 'price' | 'replacement' | 'added' | 'removed' */
  type: string
  drugId: number
  replacementDrugId: number | null
  oldValue: string | null
  newValue: string | null
  modifiedAt: string | null
  appliedToClient: boolean
}

/**
 * GET /api/distributor-orders/:id/history — список изменений товаров в
 * конкретном distributor_order. Возвращает по строке на каждое изменение:
 * qty/price/replacement, плюс added/removed для строк, которых не было у клиента.
 * Используется модалкой «История заказа» в карточке дистра.
 */
export function useDistributorOrderHistory(distributorOrderId: number | null | undefined) {
  return useQueryApiClient<ApiOrderHistoryEntry[]>({
    request: {
      url: `/api/distributor-orders/${distributorOrderId ?? 0}/history`,
      method: 'GET',
    },
    enabled: !!distributorOrderId,
  })
}
