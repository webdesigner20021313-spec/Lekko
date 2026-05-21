/**
 * Purchase orders — заказы дистрибьюторам (purchase_orders) и их статусы/позиции.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import { refetchCart } from '@/products/megaprice/stores/useCartStore'
import type { PagedResponse } from '@/shared/api/types'

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
