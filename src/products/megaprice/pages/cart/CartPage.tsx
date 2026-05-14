import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react'
import {
  ShoppingCart, Trash2, Minus, Plus,
  ChevronDown, ChevronUp, MapPin,
  Receipt, ArrowRight, Package, X,
} from 'lucide-react'

import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import { Button } from '@/shared/ui-kit/Button'
import { BottomSheet } from '@/shared/ui-kit/BottomSheet'
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
import type { CartItem, Pharmacy } from '@/products/megaprice/pages/purchase/types/purchase.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistGroup { id: string; name: string; city: string; items: CartItem[]; contactType: 'telegram' | 'email'; contact: string }
interface ConfirmPayload { groups: Array<DistGroup & { subtotal: number; qty: number }>; pharmacy: Pharmacy }

// ─── Qty Control ──────────────────────────────────────────────────────────────

function QtyControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex w-[112px] shrink-0 items-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-l-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="flex-1 text-center text-[13px] font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-r-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Empty Cart ───────────────────────────────────────────────────────────────

function EmptyCart() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 dark:bg-[#222222]">
        <ShoppingCart className="h-9 w-9 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{t('cart_empty_title')}</p>
      <p className="mt-1.5 text-sm text-gray-400 dark:text-[#929292]">{t('cart_empty_hint')}</p>
      <Link to={mp('/purchase')} className="mt-6">
        <Button size="sm" variant="outline">{t('cart_go_purchase')}</Button>
      </Link>
    </div>
  )
}

// ─── Confirm Modal — превью заказа, API-запрос отправляется на «Готово» ─────

function ConfirmModal({
  payload,
  onConfirm,
  onClose,
  isLoading,
}: {
  payload: ConfirmPayload
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}) {
  const { t } = useTranslation()
  const totalSum = payload.groups.reduce((s, g) => s + g.subtotal, 0)
  const totalItems = payload.groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#111111] dark:border dark:border-gray-700">

        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label={t('cart_close')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#222222]">
            <Receipt className="h-7 w-7 text-gray-700 dark:text-gray-300" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('cart_success_title')}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-[#929292]">{t('cart_confirm_hint')}</p>
          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-[#929292]">{payload.pharmacy.name}</p>
        </div>

        <div className="px-6 pb-4">
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:divide-[#333333] dark:border-gray-700 dark:bg-[#222222]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500 dark:text-[#929292]">{t('cart_success_order_sum')}</span>
              <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(totalSum)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500 dark:text-[#929292]">{t('cart_success_positions')}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{totalItems}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-[1fr_auto] border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-[#222222]">
              <span className="text-xs font-semibold text-gray-400 dark:text-[#929292]">{t('cart_success_dist_col')}</span>
              <span className="text-xs font-semibold text-gray-400 dark:text-[#929292]">{t('cart_success_pos_col')}</span>
            </div>
            {payload.groups.map((group, idx) => (
              <div
                key={group.id}
                className={cn('grid grid-cols-[1fr_auto] items-center bg-white px-4 py-3 dark:bg-[#111111]', idx !== payload.groups.length - 1 && 'border-b border-gray-100 dark:border-[#333333]')}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{group.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-[#929292]">{group.city}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{group.items.length}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('cart_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('cart_placing')}
              </>
            ) : (
              <>
                {t('cart_done')} <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── CartPage ─────────────────────────────────────────────────────────────────

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
  const [showPharmacyDrop, setShowPharmacyDrop] = useState(false)
  const [mobileSheetOpen,  setMobileSheetOpen]  = useState(false)
  const pharmacyDropRef = useRef<HTMLDivElement>(null)

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

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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
  const cbRef = useRef<HTMLInputElement>(null)
  if (cbRef.current) cbRef.current.indeterminate = someChecked

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pharmacyDropRef.current && !pharmacyDropRef.current.contains(e.target as Node))
        setShowPharmacyDrop(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const invoiceGroups = useMemo(() =>
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
      .filter(Boolean) as Array<DistGroup & { subtotal: number; qty: number }>,
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

      {/* ── Шапка ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6 dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('cart_title')}</h1>
          </div>

          <div className="h-5 w-px bg-gray-200 shrink-0 dark:bg-gray-700" />

          <div className="flex flex-1 gap-1.5 overflow-x-auto">
            <button
              onClick={() => setDistFilter(null)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
                distFilter === null
                  ? 'bg-gray-900 text-white shadow-sm dark:bg-[#f1f1f1] dark:text-gray-900'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800',
              )}
            >
              {t('cart_filter_all', { n: items.length })}
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setDistFilter(prev => prev === g.id ? null : g.id)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
                  distFilter === g.id
                    ? 'bg-gray-900 text-white shadow-sm dark:bg-[#f1f1f1] dark:text-gray-900'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800',
                )}
              >
                {g.name} ({g.items.length})
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ── Тело ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Левая панель — таблица (desktop) / карточки (mobile) ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Mobile cards */}
          <div className="md:hidden flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]" style={{ paddingBottom: hasSelection ? 144 : 80 }}>
            <div className="space-y-3 px-4 py-4">
              {filteredGroups.map(group => {
                const isCollapsed     = collapsed.has(group.id)
                const groupAllChecked = group.items.every(i => checkedIds.has(i.offerId))
                const groupSomeChecked = group.items.some(i => checkedIds.has(i.offerId))
                const groupTotal      = group.items.reduce((s, i) => s + effPrice(i) * i.quantity, 0)

                return (
                  <div key={group.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={groupAllChecked}
                        ref={el => { if (el) el.indeterminate = groupSomeChecked && !groupAllChecked }}
                        onChange={() => toggleGroup(group)}
                        className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-gray-900"
                      />
                      <button
                        onClick={() => toggleCollapse(group.id)}
                        className="flex flex-1 items-center justify-between text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{group.name}</p>
                          </div>
                          {(() => {
                            const d = getDiscount(Number(group.id))
                            return d ? (
                              <p className="mt-0.5 text-[10px] font-semibold text-green-700 dark:text-[#6EE7B7]">
                                персональная скидка −{d}%
                              </p>
                            ) : null
                          })()}
                          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-[#929292]">
                            {group.city} · {group.items.length} поз.
                          </p>
                        </div>
                        <div className="ml-2 shrink-0 text-right">
                          <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(groupTotal)}</p>
                        </div>
                        <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-gray-100 dark:divide-[#333333]">
                        {group.items.map(item => {
                          const isChecked = checkedIds.has(item.offerId)
                          const lineTotal = effPrice(item) * item.quantity

                          return (
                            <div key={item.offerId} className={cn('flex gap-3 px-4 py-3', isChecked && 'bg-gray-50 dark:bg-[#222222]')}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(item.offerId)}
                                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.medicine.name}</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">{item.medicine.manufacturer}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                    {item.medicine.country}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-[#929292]">{formatCurrency(effPrice(item))}</span>
                                </div>
                                <div className="mt-2.5 flex items-center justify-between gap-3">
                                  <QtyControl
                                    value={item.quantity}
                                    onChange={v => v === 0 ? removeItem(item.offerId) : updateQty(item.offerId, v)}
                                  />
                                  <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(lineTotal)}</span>
                                  <button
                                    onClick={() => removeItem(item.offerId)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 active:bg-red-50 active:text-red-500 dark:active:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-white dark:bg-[#111111]">
                <tr className="h-12 border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="w-10 px-4 text-left">
                    <input
                      ref={cbRef}
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                    />
                  </th>
                  <th className="px-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300" colSpan={5}>{t('cart_col_distributor')}</th>
                  <th className="w-[150px] px-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{t('cart_col_sum')}</th>
                  <th className="w-10 px-4" />
                </tr>
              </thead>

              <tbody>
                {filteredGroups.map(group => {
                  const isCollapsed      = collapsed.has(group.id)
                  const groupAllChecked  = group.items.every(i => checkedIds.has(i.offerId))
                  const groupSomeChecked = group.items.some(i => checkedIds.has(i.offerId))
                  const groupTotal       = group.items.reduce((s, i) => s + effPrice(i) * i.quantity, 0)
                  const groupQtyTotal    = group.items.reduce((s, i) => s + i.quantity, 0)

                  return (
                    <Fragment key={group.id}>
                      <tr className="border-t border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-[#222222]">
                        <td className="px-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={groupAllChecked}
                            ref={el => { if (el) el.indeterminate = groupSomeChecked && !groupAllChecked }}
                            onChange={() => toggleGroup(group)}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                          />
                        </td>
                        <td className="px-3 py-2.5" colSpan={5}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group.name}</span>
                            {(() => {
                              const d = getDiscount(Number(group.id))
                              return d ? (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]">
                                  персональная скидка −{d}%
                                </span>
                              ) : null
                            })()}
                            <span className="text-xs text-gray-500 dark:text-[#929292]">
                              {t('cart_group_info', { city: group.city, pos: group.items.length, qty: groupQtyTotal })}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-bold text-gray-800 dark:text-gray-200">
                          {formatCurrency(groupTotal)}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => toggleCollapse(group.id)}
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                          </button>
                        </td>
                      </tr>

                      {!isCollapsed && (
                        <tr className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
                          <td className="px-4 py-2" />
                          <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_name')}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_manufacturer')}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_country')}</td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_price')}</td>
                          <td className="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_qty')}</td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_total')}</td>
                          <td className="px-4 py-2" />
                        </tr>
                      )}
                      {!isCollapsed && group.items.map(item => {
                        const isChecked = checkedIds.has(item.offerId)
                        const lineTotal = effPrice(item) * item.quantity

                        return (
                          <tr
                            key={item.offerId}
                            className={cn(
                              'border-b border-gray-100 transition-colors duration-100 dark:border-[#333333]',
                              isChecked ? 'bg-gray-50 dark:bg-[#222222]' : 'bg-white hover:bg-gray-50 dark:bg-[#111111] dark:hover:bg-gray-800',
                            )}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(item.offerId)}
                                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                              />
                            </td>

                            <td className="max-w-[220px] px-3 py-3">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.medicine.name}
                              </p>
                            </td>

                            <td className="px-3 py-3">
                              <span className="truncate text-sm text-gray-600 dark:text-gray-400">
                                {item.medicine.manufacturer}
                              </span>
                            </td>

                            <td className="px-3 py-3">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                {item.medicine.country}
                              </span>
                            </td>

                            <td className="px-3 py-3 text-right text-sm tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-400">
                              {formatCurrency(effPrice(item))}
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex justify-center">
                                <QtyControl
                                  value={item.quantity}
                                  onChange={v => v === 0 ? removeItem(item.offerId) : updateQty(item.offerId, v)}
                                />
                              </div>
                            </td>

                            <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {formatCurrency(lineTotal)}
                            </td>

                            <td className="px-4 py-3">
                              <button
                                onClick={() => removeItem(item.offerId)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                aria-label={t('cart_remove')}
                              >
                                <Trash2 className="h-[14px] w-[14px]" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Правая панель: инвойс (desktop) ── */}
        <div className="hidden md:flex w-[360px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">

          <div ref={pharmacyDropRef} className="relative shrink-0">
            <button
              onClick={() => setShowPharmacyDrop(v => !v)}
              className="flex h-12 w-full items-center justify-between border-b border-gray-200 px-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 shrink-0 text-gray-500 dark:text-[#929292]" />
                <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{pharmacy.name}</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150', showPharmacyDrop && 'rotate-180')} />
            </button>

            {showPharmacyDrop && (
              <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-[#111111]">
                {mockPharmacies.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setPharmacyId(p.id); setShowPharmacyDrop(false) }}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                      p.id === pharmacyId ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!hasSelection ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Receipt className="h-7 w-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('cart_select_title')}</p>
              <p className="text-xs leading-relaxed text-gray-400 dark:text-[#929292]">{t('cart_select_hint')}</p>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 pt-4 pb-0">
                  <p className="text-xs text-gray-400 mb-1 dark:text-gray-500">{t('cart_total_label')}</p>
                  <p className="text-[28px] font-bold tabular-nums text-gray-900 leading-none dark:text-gray-100">{formatCurrency(invoiceTotal)}</p>
                </div>

                <div className="px-4 pb-3 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_positions')}</span>
                    <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{invoiceItemCnt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_units')}</span>
                    <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{invoiceQtyCnt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_distributors')}</span>
                    <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{invoiceGroups.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3">
                  <p className="mb-2 text-xs font-semibold text-gray-900 dark:text-gray-100">{t('cart_order_content')}</p>
                  <div className="space-y-3">
                    {invoiceGroups.map(g => (
                      <div key={g.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-[#222222]">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">{g.name}</p>
                            <p className="text-[11px] text-gray-400 dark:text-[#929292]">{g.city}</p>
                          </div>
                          <div className="ml-2 shrink-0 text-right">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{formatCurrency(g.subtotal)}</p>
                            <p className="text-[11px] text-gray-400 dark:text-[#929292]">{t('cart_group_pos_qty', { pos: g.items.length, qty: g.qty })}</p>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-100 bg-white dark:divide-[#333333] dark:bg-[#111111]">
                          {g.items.map(item => (
                            <div key={item.offerId} className="flex items-center gap-2 px-3 py-1.5">
                              <p className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-400">
                                {item.medicine.name}
                              </p>
                              <span className="shrink-0 text-[11px] text-gray-400 dark:text-[#929292]">×{item.quantity}</span>
                              <span className="w-16 shrink-0 text-right text-xs font-medium text-gray-800 dark:text-gray-200">
                                {formatCurrency(effPrice(item) * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#111111]">
                <button
                  onClick={createOrder}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
                >
                  {t('cart_create_order')}
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Mobile sticky bottom bar — над таб-баром ── */}
      <div className="md:hidden fixed inset-x-0 bottom-tabbar z-30 border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-[#111111]">
        {hasSelection ? (
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[11px] font-medium text-gray-400 dark:text-[#929292]">{t('cart_total_label')}</p>
              <p className="text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(invoiceTotal)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900">
              <span>{invoiceItemCnt} {t('cart_positions')}</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <Receipt className="h-5 w-5 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-xs text-gray-400 dark:text-[#929292]">{t('cart_select_hint')}</p>
          </div>
        )}
      </div>

      <BottomSheet
        open={mobileSheetOpen && hasSelection}
        onClose={() => setMobileSheetOpen(false)}
        title={t('cart_order_content')}
        maxHeight="92vh"
        footer={
          <div>
            <div className="mb-3 flex items-end justify-between">
              <span className="text-xs text-gray-400 dark:text-[#929292]">{t('cart_total_label')}</span>
              <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(invoiceTotal)}</span>
            </div>
            <button
              onClick={() => { setMobileSheetOpen(false); createOrder() }}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900"
            >
              {t('cart_create_order')}
            </button>
          </div>
        }
      >
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
          <button
            onClick={() => setShowPharmacyDrop(v => !v)}
            className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 px-3 dark:border-gray-700"
          >
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gray-500 dark:text-[#929292]" />
              <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{pharmacy.name}</span>
            </div>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', showPharmacyDrop && 'rotate-180')} />
          </button>
          {showPharmacyDrop && (
            <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              {mockPharmacies.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPharmacyId(p.id); setShowPharmacyDrop(false) }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-3 text-left text-sm border-b last:border-0 border-gray-100 dark:border-[#333333]',
                    p.id === pharmacyId ? 'bg-gray-50 font-semibold text-gray-900 dark:bg-[#222222] dark:text-gray-100' : 'text-gray-600 dark:text-gray-400',
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3">
          <div className="space-y-3">
            {invoiceGroups.map(g => (
              <div key={g.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{g.name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-[#929292]">{g.city}</p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(g.subtotal)}</p>
                    <p className="text-[11px] text-gray-400 dark:text-[#929292]">{t('cart_group_pos_qty', { pos: g.items.length, qty: g.qty })}</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 bg-white dark:divide-[#333333] dark:bg-[#111111]">
                  {g.items.map(item => (
                    <div key={item.offerId} className="flex items-center gap-2 px-3 py-2">
                      <p className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">{item.medicine.name}</p>
                      <span className="shrink-0 text-[11px] text-gray-400 dark:text-[#929292]">×{item.quantity}</span>
                      <span className="w-20 shrink-0 text-right text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(effPrice(item) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 rounded-xl bg-gray-50 px-4 py-3 dark:bg-[#222222]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_positions')}</span>
              <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{invoiceItemCnt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_units')}</span>
              <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{invoiceQtyCnt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_distributors')}</span>
              <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{invoiceGroups.length}</span>
            </div>
          </div>
        </div>
      </BottomSheet>

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
