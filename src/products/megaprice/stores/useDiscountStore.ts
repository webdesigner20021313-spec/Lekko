import { useEffect } from 'react'
import { create } from 'zustand'
import { api } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/useAuthStore'

/**
 * Shared-store персональных скидок аптеки. Один источник правды для всех
 * мест где применяется скидка: WholesalersPage (просмотр/редактирование),
 * CartPage (effPrice), SupplierOffers/SupplierRow (отрисовка).
 *
 * До этого discount хранилcя в useWholesalersStore по имени дистра — заполнялся
 * только при заходе на /wholesalers, при прямом переходе на /cart скидка не
 * применялась. Здесь — fetch'им при первом обращении и кешируем в памяти.
 *
 * Lookup ведётся по distributorId (надёжнее имени).
 */
interface DiscountState {
  byDistributorId: Map<number, number>
  isLoading: boolean
  loaded: boolean
  drugStoreId: number | null
  inFlight: Promise<void> | null
}

interface DiscountActions {
  setDrugStoreId: (id: number | null) => void
  refetch: () => Promise<void>
  /** Получить скидку (%) для distributorId. null если её нет. */
  get: (distributorId: number) => number | null
}

interface ApiPersonalDiscount {
  distributorId: number
  discountPercent: number
}

export const useDiscountStore = create<DiscountState & DiscountActions>((set, get) => ({
  byDistributorId: new Map(),
  isLoading: false,
  loaded: false,
  drugStoreId: null,
  inFlight: null,

  setDrugStoreId: (id) => {
    if (get().drugStoreId === id) return
    set({ drugStoreId: id, byDistributorId: new Map(), loaded: false })
  },

  refetch: () => {
    const { drugStoreId, inFlight } = get()
    if (!drugStoreId) return Promise.resolve()
    if (inFlight) return inFlight

    const promise = (async () => {
      set({ isLoading: true })
      try {
        const res = await api.get<ApiPersonalDiscount[]>('/api/drugsearch/personal-discounts', {
          params: { drugStoreId },
        })
        const map = new Map<number, number>()
        for (const d of res.data ?? []) {
          map.set(d.distributorId, d.discountPercent)
        }
        set({ byDistributorId: map, loaded: true })
      } catch {
        // 401 ловит axios interceptor → редирект на /login.
      } finally {
        set({ isLoading: false, inFlight: null })
      }
    })()
    set({ inFlight: promise })
    return promise
  },

  get: (distributorId) => {
    const v = get().byDistributorId.get(distributorId)
    return v ?? null
  },
}))

/**
 * Хук-подписчик. Триггерит автозагрузку при смене drugStoreId.
 * Возвращает функцию-лукап и метку загрузки.
 *
 *   const { getDiscount, refetch } = useDiscounts()
 *   const percent = getDiscount(123)   // 7.5 или null
 */
export function useDiscounts() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  const byId = useDiscountStore((s) => s.byDistributorId)
  const isLoading = useDiscountStore((s) => s.isLoading)
  const refetch = useDiscountStore((s) => s.refetch)
  const setDrugStoreId = useDiscountStore((s) => s.setDrugStoreId)

  useEffect(() => {
    setDrugStoreId(drugStoreId)
    if (drugStoreId) void refetch()
  }, [drugStoreId, setDrugStoreId, refetch])

  function getDiscount(distributorId: number | string | null | undefined): number | null {
    if (distributorId === null || distributorId === undefined) return null
    const id = typeof distributorId === 'string' ? Number(distributorId) : distributorId
    if (!Number.isFinite(id)) return null
    return byId.get(id) ?? null
  }

  return { byId, isLoading, getDiscount, refetch }
}

/** Side-effect refetch для onSuccess мутаций (save / delete). */
export const refetchDiscounts = () => useDiscountStore.getState().refetch()
