/**
 * Cart — корзина. Все хуки работают с ОДНИМ shared store (useCartStore):
 *   - useCart() — читает state, делает refetch при изменении drugStoreId
 *   - мутации (add/update/remove/clear/cancel) после успеха вызывают refetchCart(),
 *     и ВСЕ потребители useCart обновляются.
 *
 * Параметр onSuccess в мутациях оставлен для обратной совместимости (cart.refetch),
 * но сам по себе refetchCart() уже вызывается — onSuccess можно просто опускать.
 *
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useEffect } from 'react'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import { refetchCart, useCartStore } from '@/products/megaprice/stores/useCartStore'

export type { AddCartItemDto } from '@/shared/api/types'

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

/**
 * Bulk-добавление позиций корзины (для AutoSelect / Excel-import).
 * POST /api/cart/items/bulk → { added: CartItemDto[], failed: BulkAddFailure[] }
 * Один HTTP вместо N последовательных. После success — refetchCart.
 */
export interface AddCartItemPayload {
  drugStoreId: number
  drugId: number
  distributorId: number
  itemId?: number | null
  priceId?: number | null
  price: number
  producerId?: number | null
  quantity: number
}
export interface BulkAddFailure {
  index: number
  drugId: number
  distributorId: number
  itemId: number | null
  error: string
}
export interface BulkAddCartResult {
  added: unknown[]      // CartItemDto[] — нам нужен только count, детали не парсим.
  failed: BulkAddFailure[]
}

export function useAddToCartBulk() {
  return useQueryApiClient<BulkAddCartResult>({
    request: { url: '/api/cart/items/bulk', method: 'POST', disableOnMount: true },
    onSuccess: (data, pass) => {
      void refetchCart()
      if (typeof pass === 'function') (pass as (d: BulkAddCartResult) => void)(data as BulkAddCartResult)
    },
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

/**
 * POST /api/cart/cancel?drugStoreId — отменить активную корзину (status_id 0→6).
 * Удаляет все purchase_items и переводит purchase в cancelled. После — корзина пуста.
 * Используется кнопкой «Отменить корзину» на CartPage.
 */
export function useCancelActiveCart(onSuccess?: () => void) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient({
    request: {
      url: '/api/cart/cancel',
      method: 'POST',
      params: { drugStoreId },
      disableOnMount: true,
    },
    onSuccess: () => { void refetchCart(); onSuccess?.() },
  })
}
