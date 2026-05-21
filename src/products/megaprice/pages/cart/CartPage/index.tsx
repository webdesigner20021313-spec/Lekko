import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingOverlay } from '@/shared/ui-kit/LoadingOverlay'
import { useToast } from '@/shared/ui-kit/Toaster'
import { usePlaceOrders } from '@/products/megaprice/api/hooks'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useIsReadOnly } from '@/products/megaprice/hooks/useIsReadOnly'
import { mockPharmacies } from '@/products/megaprice/mocks/purchase.mocks'
import { mp } from '@/products/megaprice/utils/path'

import { CartGroupCardMobile } from './CartGroupCardMobile'
import { CartHeader } from './CartHeader'
import { CartTable } from './CartTable'
import { ConfirmModal } from './ConfirmModal'
import { EmptyCart } from './EmptyCart'
import { InvoiceSheet } from './InvoiceSheet'
import { InvoiceSidebar } from './InvoiceSidebar'
import { MobileBottomBar } from './MobileBottomBar'
import { useCartData } from './useCartData'
import { useCartSelection } from './useCartSelection'
import type { ConfirmPayload, DistGroup, InvoiceGroup } from './types'

export function CartPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const drugStoreId = useAuthStore(s => s.drugStore?.drugStoreId ?? null)
  const readOnly = useIsReadOnly()

  // Данные корзины: адаптер API→CartItem, цена со скидкой, мутации qty/remove.
  const { isLoading, apiItems, items, getDiscount, effPrice, removeItem, updateQty } = useCartData()

  const [pharmacyId,      setPharmacyId]      = useState(mockPharmacies[0]?.id ?? '')
  const [confirmPayload,  setConfirmPayload]  = useState<ConfirmPayload | null>(null)
  const [distFilter,      setDistFilter]      = useState<string | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

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

  // Выбор позиций (чекбоксы + свёрнутые группы + тогглеры + авто-выбор).
  const {
    checkedIds, setCheckedIds, collapsed,
    toggleCollapse, toggleItem, toggleGroup, toggleAll,
    allChecked, someChecked,
  } = useCartSelection(items, filteredItems)

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
    if (readOnly) {
      toast({
        title: 'Режим просмотра',
        description: 'Дистрибьютор не может оформлять заказы',
        variant: 'warning',
      })
      return
    }
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
    if (cartItemIds.length === 0) {
      // Раньше тут был silent return — user видел что «Готово» нажимается и ничего
      // не происходит. Чаще всего причина: модалка осталась открытой после того
      // как товар был удалён из корзины (race). Закрываем + сообщаем.
      setConfirmPayload(null)
      toast({
        title: 'Корзина пуста или товары удалены',
        description: 'Добавьте позиции и попробуйте снова',
        variant: 'warning',
      })
      return
    }

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
      <LoadingOverlay show={isLoading} label="Обновляем корзину…" />

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
