import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingOverlay } from '@/shared/ui-kit/LoadingOverlay'
import { useToast } from '@/shared/ui-kit/Toaster'
import {
  useCart,
  useDistributorsBatch,
  useDrugsCartEnrichment,
  usePlaceOrders,
  useRemoveFromCart,
  useUpdateCartQty,
} from '@/products/megaprice/api/hooks'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useDiscounts } from '@/products/megaprice/stores/useDiscountStore'
import { mockPharmacies } from '@/products/megaprice/mocks/purchase.mocks'
import { mp } from '@/products/megaprice/utils/path'
import type { CartItem } from '@/products/megaprice/pages/purchase/types/purchase.types'

import { CartGroupCardMobile } from './CartGroupCardMobile'
import { CartHeader } from './CartHeader'
import { CartTable } from './CartTable'
import { ConfirmModal } from './ConfirmModal'
import { EmptyCart } from './EmptyCart'
import { InvoiceSheet } from './InvoiceSheet'
import { InvoiceSidebar } from './InvoiceSidebar'
import { MobileBottomBar } from './MobileBottomBar'
import type { ConfirmPayload, DistGroup, InvoiceGroup } from './types'

export function CartPage() {
  const { t } = useTranslation()

  // ── Real API: cart + batch-enrichment (drug fullName, distributor name) ──
  const cart = useCart()
  const apiItems = cart.data?.items ?? []

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
  const navigate = useNavigate()
  const { toast } = useToast()
  const drugStoreId = useAuthStore(s => s.drugStore?.drugStoreId ?? null)

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

  const [pharmacyId,     setPharmacyId]     = useState(mockPharmacies[0]?.id ?? '')
  const [checkedIds,     setCheckedIds]     = useState<Set<string>>(new Set())
  const [confirmPayload, setConfirmPayload] = useState<ConfirmPayload | null>(null)
  const [distFilter,     setDistFilter]     = useState<string | null>(null)
  const [collapsed,      setCollapsed]      = useState<Set<string>>(new Set())
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // POST /api/purchases/place-orders — отправляется ТОЛЬКО при подтверждении в
  // confirm-модалке (нажатие «Готово»). Сам клик «Заказать» лишь открывает модалку.
  const placeOrdersApi = usePlaceOrders(() => {
    setCheckedIds(new Set())
    setConfirmPayload(null)
    navigate(mp('/orders'))
    toast({
      title: t('cart_placed_toast_title'),
      description: t('cart_placed_toast_desc'),
      variant: 'default',
    })
  })

  const pharmacy = mockPharmacies.find(p => p.id === pharmacyId) ?? mockPharmacies[0]

  const groups = useMemo((): DistGroup[] => {
    const map = new Map<string, DistGroup>()
    for (const item of items) {
      const { id, name, city, contactType, contact } = item.offer.distributor
      if (!map.has(id)) map.set(id, { id, name, city, contactType, contact, items: [] })
      map.get(id)!.items.push(item)
    }
    return Array.from(map.values())
  }, [items])

  const filteredGroups = useMemo(() =>
    distFilter ? groups.filter(g => g.id === distFilter) : groups,
    [groups, distFilter],
  )
  const filteredItems = useMemo(() => filteredGroups.flatMap(g => g.items), [filteredGroups])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleItem = useCallback((offerId: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(offerId) ? next.delete(offerId) : next.add(offerId)
      return next
    })
  }, [])

  const toggleGroup = useCallback((group: DistGroup) => {
    const allIn = group.items.every(i => checkedIds.has(i.offerId))
    setCheckedIds(prev => {
      const next = new Set(prev)
      group.items.forEach(i => allIn ? next.delete(i.offerId) : next.add(i.offerId))
      return next
    })
  }, [checkedIds])

  const toggleAll = useCallback(() => {
    const allVisible = filteredItems.every(i => checkedIds.has(i.offerId))
    setCheckedIds(prev => {
      const next = new Set(prev)
      filteredItems.forEach(i => allVisible ? next.delete(i.offerId) : next.add(i.offerId))
      return next
    })
  }, [filteredItems, checkedIds])

  const allChecked  = filteredItems.length > 0 && filteredItems.every(i => checkedIds.has(i.offerId))
  const someChecked = !allChecked && filteredItems.some(i => checkedIds.has(i.offerId))

  const invoiceGroups = useMemo<InvoiceGroup[]>(() =>
    groups
      .map(g => {
        const selected = g.items.filter(i => checkedIds.has(i.offerId))
        if (!selected.length) return null
        return {
          ...g,
          items:    selected,
          subtotal: selected.reduce((s, i) => s + effPrice(i) * i.quantity, 0),
          qty:      selected.reduce((s, i) => s + i.quantity, 0),
        }
      })
      .filter(Boolean) as InvoiceGroup[],
    [groups, checkedIds, effPrice],
  )

  const hasSelection   = invoiceGroups.length > 0
  const invoiceTotal   = invoiceGroups.reduce((s, g) => s + g.subtotal, 0)
  const invoiceItemCnt = invoiceGroups.reduce((s, g) => s + g.items.length, 0)
  const invoiceQtyCnt  = invoiceGroups.reduce((s, g) => s + g.qty, 0)

  // «Заказать»: только открывает confirm-модалку с превью. Никаких API-запросов.
  function createOrder() {
    if (!invoiceGroups.length || !drugStoreId) return
    setConfirmPayload({ groups: invoiceGroups, pharmacy })
  }

  // «Готово» внутри confirm-модалки: вот тут реально летит POST.
  // На success хук usePlaceOrders сделает refetchCart + наш onSuccess
  // (выше) сбросит чекбоксы, закроет модалку, перейдёт на /orders + тост.
  function confirmPlace() {
    if (!confirmPayload || !drugStoreId || placeOrdersApi.isLoading) return

    const selectedOfferIds = new Set<string>()
    confirmPayload.groups.forEach(g => g.items.forEach(i => selectedOfferIds.add(i.offerId)))

    const cartItemIds: number[] = []
    apiItems.forEach(api => {
      if (selectedOfferIds.has(String(api.id))) cartItemIds.push(api.id)
    })
    if (cartItemIds.length === 0) return

    placeOrdersApi.appendData({ drugStoreId, cartItemIds })
  }

  function handleConfirmClose() {
    if (placeOrdersApi.isLoading) return
    setConfirmPayload(null)
  }

  // ── Empty state ──
  if (items.length === 0 && !confirmPayload) {
    return (
      <div className="flex h-full flex-col bg-gray-50 dark:bg-[#111111]">
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 md:px-6 dark:border-gray-700 dark:bg-[#111111]">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('cart_title')}</h1>
        </div>
        <EmptyCart />
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">
      <LoadingOverlay show={cart.isLoading} label="Обновляем корзину…" />

      <CartHeader
        itemCount={items.length}
        groups={groups}
        distFilter={distFilter}
        onChangeFilter={setDistFilter}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Mobile cards */}
          <div className="md:hidden flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]" style={{ paddingBottom: hasSelection ? 144 : 80 }}>
            <div className="space-y-3 px-4 py-4">
              {filteredGroups.map(group => (
                <CartGroupCardMobile
                  key={group.id}
                  group={group}
                  isCollapsed={collapsed.has(group.id)}
                  checkedIds={checkedIds}
                  effPrice={effPrice}
                  getDiscount={getDiscount}
                  onToggleCollapse={toggleCollapse}
                  onToggleGroup={toggleGroup}
                  onToggleItem={toggleItem}
                  onRemoveItem={removeItem}
                  onUpdateQty={updateQty}
                />
              ))}
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block flex-1 overflow-auto">
            <CartTable
              groups={filteredGroups}
              collapsed={collapsed}
              checkedIds={checkedIds}
              effPrice={effPrice}
              getDiscount={getDiscount}
              allChecked={allChecked}
              someChecked={someChecked}
              onToggleAll={toggleAll}
              onToggleCollapse={toggleCollapse}
              onToggleGroup={toggleGroup}
              onToggleItem={toggleItem}
              onRemoveItem={removeItem}
              onUpdateQty={updateQty}
            />
          </div>
        </div>

        <InvoiceSidebar
          pharmacy={pharmacy}
          pharmacyId={pharmacyId}
          onSelectPharmacy={setPharmacyId}
          invoiceGroups={invoiceGroups}
          invoiceTotal={invoiceTotal}
          invoiceItemCnt={invoiceItemCnt}
          invoiceQtyCnt={invoiceQtyCnt}
          effPrice={effPrice}
          onCreateOrder={createOrder}
        />
      </div>

      <MobileBottomBar
        hasSelection={hasSelection}
        invoiceTotal={invoiceTotal}
        invoiceItemCnt={invoiceItemCnt}
        onOpenSheet={() => setMobileSheetOpen(true)}
      />

      <InvoiceSheet
        open={mobileSheetOpen && hasSelection}
        onClose={() => setMobileSheetOpen(false)}
        pharmacy={pharmacy}
        pharmacyId={pharmacyId}
        onSelectPharmacy={setPharmacyId}
        invoiceGroups={invoiceGroups}
        invoiceTotal={invoiceTotal}
        invoiceItemCnt={invoiceItemCnt}
        invoiceQtyCnt={invoiceQtyCnt}
        effPrice={effPrice}
        onCreateOrder={createOrder}
      />

      {confirmPayload && (
        <ConfirmModal
          payload={confirmPayload}
          onConfirm={confirmPlace}
          onClose={handleConfirmClose}
          isLoading={placeOrdersApi.isLoading}
        />
      )}
    </div>
  )
}
