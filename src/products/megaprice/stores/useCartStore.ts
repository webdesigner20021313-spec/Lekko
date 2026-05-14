import { create } from 'zustand'
import { api } from '@/shared/api/client'
import type { CartResponse } from '@/shared/api/types'

/**
 * Shared-store корзины. Один источник правды для всех потребителей `useCart`
 * (Header-badge, SupplierOffers, DistributorProducts, CartPage). До этого
 * каждый вызов `useCart()` создавал свой инстанс `useQueryApiClient` →
 *   - 4 параллельных GET /api/cart при загрузке Purchase
 *   - после add/remove обновлялся ТОЛЬКО локальный инстанс, бэйдж висел старый
 *
 * Дедуп: если refetch уже в полёте — возвращаем существующий promise.
 */
interface CartState {
  data: CartResponse | null
  isLoading: boolean
  drugStoreId: number | null
  /** Promise активного refetch'а; null когда не в полёте. */
  inFlight: Promise<void> | null
}

interface CartActions {
  setDrugStoreId: (id: number | null) => void
  refetch: () => Promise<void>
  reset: () => void
}

export const useCartStore = create<CartState & CartActions>((set, get) => ({
  data: null,
  isLoading: false,
  drugStoreId: null,
  inFlight: null,

  setDrugStoreId: (id) => {
    if (get().drugStoreId === id) return
    set({ drugStoreId: id, data: null })
  },

  refetch: () => {
    const { drugStoreId, inFlight } = get()
    if (!drugStoreId) return Promise.resolve()
    if (inFlight) return inFlight

    const promise = (async () => {
      set({ isLoading: true })
      try {
        const res = await api.get<CartResponse>('/api/cart', {
          params: { drugStoreId },
        })
        set({ data: res.data })
      } catch {
        // 401 уже ловится axios-interceptor'ом → редирект на /login.
      } finally {
        set({ isLoading: false, inFlight: null })
      }
    })()
    set({ inFlight: promise })
    return promise
  },

  reset: () => set({ data: null, isLoading: false, drugStoreId: null, inFlight: null }),
}))

/** Удобный side-effect-free refetch для onSuccess мутаций. */
export const refetchCart = () => useCartStore.getState().refetch()
