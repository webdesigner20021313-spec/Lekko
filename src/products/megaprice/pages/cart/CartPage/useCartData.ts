import { useCallback, useEffect, useMemo } from 'react'
import {
  useCart,
  useDistributorsBatch,
  useDrugsCartEnrichment,
  useRemoveFromCart,
  useUpdateCartQty,
} from '@/products/megaprice/api/hooks'
import { useDiscounts } from '@/products/megaprice/stores/useDiscountStore'
import type { CartItem } from '@/products/megaprice/pages/purchase/types/purchase.types'

/**
 * Данные корзины: fetch + batch-обогащение (имена препаратов/дистров) +
 * адаптер API-cart → UI-CartItem + цена со скидкой + мутации qty/remove.
 * Вынесено из CartPage, чтобы компонент остался преимущественно render'ом.
 */
export function useCartData() {
  // ── Real API: cart + batch-enrichment (drug fullName, distributor name) ──
  const cart = useCart()
  // useMemo для стабильной ссылки — иначе новый [] на каждый рендер дёргает
  // зависящие useMemo (drugIds/distributorIds/items).
  const apiItems = useMemo(() => cart.data?.items ?? [], [cart.data])

  const drugIds = useMemo(
    () => Array.from(new Set(apiItems.map(i => i.drugId).filter((id): id is number => !!id))),
    [apiItems],
  )
  const distributorIds = useMemo(
    () => Array.from(new Set(apiItems.map(i => i.distributorId).filter((id): id is number => !!id))),
    [apiItems],
  )
  const drugIdsKey = drugIds.slice().sort((a, b) => a - b).join(',')
  const distrIdsKey = distributorIds.slice().sort((a, b) => a - b).join(',')

  // Cart-enrichment: drug + producer + country одним вызовом для карточек cart-row.
  const drugs = useDrugsCartEnrichment()
  const distributors = useDistributorsBatch()

  useEffect(() => {
    if (drugIds.length > 0) drugs.appendData({ ids: drugIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugIdsKey])
  useEffect(() => {
    if (distributorIds.length > 0) distributors.appendData({ ids: distributorIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distrIdsKey])

  const drugInfoById = useMemo(() => {
    const m = new Map<number, { name: string; producer: string; country: string }>()
    const list = Array.isArray(drugs.data) ? drugs.data : []
    list.forEach(d => m.set(d.id, {
      name: d.fullName,
      producer: d.producerName ?? '',
      country: d.countryName ?? '',
    }))
    return m
  }, [drugs.data])
  const distrNameById = useMemo(() => {
    const m = new Map<number, string>()
    const list = Array.isArray(distributors.data) ? distributors.data : []
    list.forEach(d => m.set(d.id, d.name))
    return m
  }, [distributors.data])

  const updateApi = useUpdateCartQty()
  const removeApi = useRemoveFromCart()

  // Адаптер API-cart → UI-CartItem (тот же shape что у usePurchaseCart-mock).
  // offerId = String(cart_item.id) — PUT/DELETE используют именно это.
  const items: CartItem[] = useMemo(() => apiItems.map(it => {
    const info = drugInfoById.get(it.drugId)
    const drugName = info?.name ?? it.drugName ?? `Drug ${it.drugId}`
    // Производитель: первичный источник — /drugs/cart-enrichment (drug_primary_producer MV);
    // fallback — producerName из самого cart-item (если бэк его передал).
    const producer = info?.producer || it.producerName || ''
    const country  = info?.country || ''
    const distrName = distrNameById.get(it.distributorId) ?? it.distributorName ?? `Дистр ${it.distributorId}`
    return {
      offerId: String(it.id),
      medicineId: String(it.drugId),
      quantity: it.quantity,
      offer: {
        id: String(it.id),
        medicineId: String(it.drugId),
        distributor: {
          id: String(it.distributorId),
          name: distrName,
          city: '',
          lastPriceDate: '',
          contactType: 'email' as const,
          contact: '',
        },
        expiryDate: '',
        paymentTypes: [],
        priceWithVat: it.price,
      },
      medicine: {
        id: String(it.drugId),
        drugId: it.drugId,
        name: drugName,
        mnn: '',
        manufacturer: producer,
        country,
        isFavorite: false,
      },
    }
  }), [apiItems, drugInfoById, distrNameById])

  const removeItem = useCallback((offerId: string) => {
    const id = Number(offerId)
    if (Number.isFinite(id)) removeApi.appendData({}, { id })
  }, [removeApi])

  const updateQty = useCallback((offerId: string, qty: number) => {
    const id = Number(offerId)
    if (!Number.isFinite(id)) return
    if (qty <= 0) removeApi.appendData({}, { id })
    else updateApi.appendData({ quantity: qty }, { id })
  }, [updateApi, removeApi])

  // Персональные скидки — shared store, авто-fetch при mount. Lookup по distributorId.
  const { getDiscount } = useDiscounts()

  const effPrice = useCallback((item: CartItem) => {
    const d = getDiscount(item.offer.distributor.id)
    return d ? Math.round(item.offer.priceWithVat * (1 - d / 100)) : item.offer.priceWithVat
  }, [getDiscount])

  return {
    isLoading: cart.isLoading,
    apiItems,
    items,
    getDiscount,
    effPrice,
    removeItem,
    updateQty,
  }
}
