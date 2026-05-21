/**
 * Purchases — закупки (сессия checkout: variants → orders → items), статистика,
 * детали, смена статуса, place-orders.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import { refetchCart } from '@/products/megaprice/stores/useCartStore'
import type { PagedResponse } from '@/shared/api/types'
import type { ApiPurchaseOrder, ApiPurchaseOrderItem } from './orders'

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
 *
 * Серверные фильтры (для OrderHistoryPage):
 *  - search           — ILIKE по purchase_number/id, '%…%' формирует бэкенд
 *  - dateFrom/dateTo  — yyyy-MM-dd (включительно по дням)
 *  - statusIds        — мульти-фильтр по status_id (KPI пилюли)
 */
export function usePurchases(opts: {
  page?: number
  pageSize?: number
  statusId?: number | null
  /** true = только покупки с placed orders (для /orders); false = только чистый draft. */
  hasPlacedOrders?: boolean | null
  search?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  statusIds?: number[] | null
  /**
   * Доп. цель ILIKE-поиска: бэк не может ходить в DrugStoreCatalog за именами
   * дистров (правило DB-per-service), поэтому фронт сначала резолвит ids дистров
   * по строке search, и передаёт их сюда — бэк OR'ит с purchase_number/id.
   */
  searchDistributorIds?: number[] | null
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
        search: opts.search && opts.search.trim() ? opts.search.trim() : undefined,
        dateFrom: opts.dateFrom || undefined,
        dateTo:   opts.dateTo   || undefined,
        statusIds: opts.statusIds && opts.statusIds.length > 0 ? opts.statusIds : undefined,
        searchDistributorIds: opts.searchDistributorIds && opts.searchDistributorIds.length > 0
          ? opts.searchDistributorIds : undefined,
      },
    },
    enabled: !!drugStoreId,
  })
}

/**
 * GET /api/purchases/stats — counts/sums по каждому status_id.
 * Используется на /orders для KPI плиток (new/modified/completed/cancelled).
 * Принимает те же фильтры что usePurchases, КРОМЕ statusIds (плитки нужны по всем
 * бакетам одновременно, иначе пользователь не увидит, что есть в других статусах).
 */
export interface PurchaseStatusStat {
  statusId: number
  count: number
  totalSum: number
}
export function usePurchaseStats(opts: {
  hasPlacedOrders?: boolean | null
  search?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  searchDistributorIds?: number[] | null
} = {}) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<PurchaseStatusStat[]>({
    request: {
      url: '/api/purchases/stats',
      method: 'GET',
      params: {
        drugStoreId,
        hasPlacedOrders: opts.hasPlacedOrders ?? undefined,
        search: opts.search && opts.search.trim() ? opts.search.trim() : undefined,
        dateFrom: opts.dateFrom || undefined,
        dateTo:   opts.dateTo   || undefined,
        searchDistributorIds: opts.searchDistributorIds && opts.searchDistributorIds.length > 0
          ? opts.searchDistributorIds : undefined,
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
