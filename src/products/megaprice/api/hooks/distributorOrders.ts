/**
 * Distributor orders — workflow между клиент-копией и distributor-копией заказа:
 * accept/reject (per-distributor и all), diff, отмена закупки, история изменений.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import type { ApiPurchase } from './purchases'
import type { ApiPurchaseOrder, ApiPurchaseOrderItem } from './orders'

/**
 * POST /api/distributor-orders/{id}/accept — принять под-заказ.
 *   - status 10 (pending) → 12 (approved): дистр сразу принимает
 *   - status 11 (modified) → 12: аптека принимает изменения дистра
 * Body: { purchaseId }. После — RecalcPurchaseStatus + SignalR.
 */
export function useAcceptDistributorOrder(onSuccess?: () => void) {
  return useQueryApiClient({
    request: {
      url: '/api/distributor-orders/:id/accept',
      method: 'POST',
      disableOnMount: true,
    },
    onSuccess: () => { onSuccess?.() },
  })
}

/**
 * POST /api/distributor-orders/{id}/reject — отклонить под-заказ.
 *   - 10 → 13 (rejected): дистр отказался выполнять
 *   - 11 → 13: аптека отклонила изменения дистра
 * Body: { purchaseId }.
 */
export function useRejectDistributorOrder(onSuccess?: () => void) {
  return useQueryApiClient({
    request: {
      url: '/api/distributor-orders/:id/reject',
      method: 'POST',
      disableOnMount: true,
    },
    onSuccess: () => { onSuccess?.() },
  })
}

/**
 * POST /api/purchases/{id}/cancel — отменить snapshot-закупку (sent или modified) целиком:
 * все её distributor_orders 10/11 → 13, purchase.status → 6. Финальные (5/6) не отменяются.
 */
export function useCancelPurchase(onSuccess?: () => void) {
  return useQueryApiClient({
    request: {
      url: '/api/purchases/:id/cancel',
      method: 'POST',
      disableOnMount: true,
    },
    onSuccess: () => { onSuccess?.() },
  })
}

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
