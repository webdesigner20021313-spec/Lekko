import { useState, useMemo, useEffect } from 'react'
import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SupplierFilters, type IdNameOption } from './SupplierFilters'
import { SupplierTable } from './SupplierTable'
import {
  useAddToCart,
  useCart,
  useOffersByDrugId,
  useRemoveFromCart,
  useUpdateCartQty,
} from '@/products/megaprice/api/hooks'
import { mapPriceOfferToSupplierOffer } from '@/products/megaprice/api/adapters'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { Pagination } from '@/shared/ui-kit/Pagination'
import { LoadingOverlay } from '@/shared/ui-kit/LoadingOverlay'
import type { Medicine, SortField, SortDirection, BonusType, ColumnKey } from '@/products/megaprice/pages/purchase/types/purchase.types'


interface SupplierOffersProps {
  medicine: Medicine | null
}

export function SupplierOffers({ medicine }: SupplierOffersProps) {
  const { t } = useTranslation()
  // id-based фильтры — отправляются на бэк как distributorIds/regionIds.
  // Кэш имён для отрисовки галочек в dropdown'е (когда выбранный не в текущей странице).
  const [distributorIds, setDistributorIds] = useState<number[]>([])
  const [selectedDistributors, setSelectedDistributors] = useState<IdNameOption[]>([])
  const [cityIds, setCityIds] = useState<number[]>([])
  const [selectedCities, setSelectedCities] = useState<IdNameOption[]>([])
  const [bonusFilter, setBonusFilter] = useState<BonusType[]>([])
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    expiry: true, payment: true, price: true, bonus: true, quantity: true,
  })

  function handleToggleColumn(key: ColumnKey) {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)

  // Backend: офферы для выбранного drugId — все фильтры (distributor/region) уходят на бэк.
  const apiOffers = useOffersByDrugId(medicine?.drugId ?? null, {
    page,
    pageSize: pageSize,
    distributorIds: distributorIds.length > 0 ? distributorIds : undefined,
    regionIds: cityIds.length > 0 ? cityIds : undefined,
  })

  // Корзина — источник правды для qty. После add/update/remove → refetch.
  const cart = useCart()
  const addCart = useAddToCart(cart.refetch)
  const updateCart = useUpdateCartQty(cart.refetch)
  const removeCart = useRemoveFromCart(cart.refetch)

  // itemId → cart-item (нужен item.id для PUT/DELETE и текущая quantity для UI).
  // Бэкенд возвращает priceId=null (legacy-поле), маппиться нужно по itemId —
  // иначе карта пустая и "+1" зацикливается на addCart, зарезаемый dedup'ом.
  const cartByItemId = useMemo(() => {
    const map = new Map<string, { id: number; quantity: number }>()
    cart.data?.items?.forEach((it) => {
      if (it.itemId !== null && it.itemId !== undefined) {
        map.set(String(it.itemId), { id: it.id, quantity: it.quantity })
      }
    })
    return map
  }, [cart.data?.items])

  // quantities[itemId] — для отображения в QuantityControl.
  const quantities = useMemo(() => {
    const m: Record<string, number> = {}
    cartByItemId.forEach((v, key) => { m[key] = v.quantity })
    return m
  }, [cartByItemId])

  // Сброс при смене препарата.
  useEffect(() => {
    setDistributorIds([])
    setSelectedDistributors([])
    setCityIds([])
    setSelectedCities([])
    setBonusFilter([])
    setPage(1)
  }, [medicine?.id])

  // Сброс page=1 при смене фильтров (без него можно «застрять» на 5-й стр).
  const distrIdsKey = distributorIds.slice().sort((a, b) => a - b).join(',')
  const cityIdsKey = cityIds.slice().sort((a, b) => a - b).join(',')
  useEffect(() => {
    setPage(1)
  }, [distrIdsKey, cityIdsKey])

  const offersForMedicine = useMemo(() => {
    if (!medicine?.drugId) return []
    const items =
      apiOffers.data && 'items' in apiOffers.data ? apiOffers.data.items : []
    return items.map(mapPriceOfferToSupplierOffer)
  }, [medicine?.drugId, apiOffers.data])

  // Средняя цена на текущей странице — для индикатора «выше/ниже среднего».
  const avgPrice = useMemo(() => {
    if (!offersForMedicine.length) return 0
    return offersForMedicine.reduce((sum, o) => sum + o.priceWithVat, 0) / offersForMedicine.length
  }, [offersForMedicine])

  // На фронте оставляем только сортировку (нет такого backend-параметра) и
  // bonus-фильтр (бэк не возвращает bonus-метаданные). Distributor/city/search —
  // полностью на бэке.
  const filteredOffers = useMemo(() => {
    let list = offersForMedicine
    if (bonusFilter.length) list = list.filter((o) => o.bonus && bonusFilter.includes(o.bonus.type))

    if (sortField === 'price') {
      list = [...list].sort((a, b) =>
        sortDir === 'asc' ? a.priceWithVat - b.priceWithVat : b.priceWithVat - a.priceWithVat
      )
    } else if (sortField === 'expiry') {
      list = [...list].sort((a, b) => {
        const da = new Date(a.expiryDate).getTime()
        const db = new Date(b.expiryDate).getTime()
        return sortDir === 'asc' ? da - db : db - da
      })
    }
    return list
  }, [offersForMedicine, bonusFilter, sortField, sortDir])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function handleQuantityChange(offerId: string, qty: number) {
    const offer = offersForMedicine.find((o) => o.id === offerId)
    if (!offer || !medicine?.drugId) return

    const existing = cartByItemId.get(offerId)

    if (qty <= 0) {
      if (existing) removeCart.appendData({}, { id: existing.id })
      return
    }

    if (existing) {
      updateCart.appendData({ quantity: qty }, { id: existing.id })
    } else {
      addCart.appendData({
        drugStoreId,
        drugId: medicine.drugId,
        distributorId: Number(offer.distributor.id),
        itemId: Number(offer.id),  // id позиции в прайс-листе дистра
        price: offer.priceWithVat,
        producerId: null,
        quantity: qty,
      })
    }
  }

  if (!medicine) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-xl bg-gray-100 p-5 dark:bg-[#222222]">
          <Package className="h-10 w-10 text-gray-400" />
        </div>
        <div>
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">{t('select_medicine_title')}</p>
          <p className="mt-1 text-sm text-gray-400">{t('select_from_left')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <SupplierFilters
        drugStoreId={drugStoreId}
        distributorIds={distributorIds}
        selectedDistributors={selectedDistributors}
        onToggleDistributor={(opt) => {
          const isAdding = !distributorIds.includes(opt.id)
          setDistributorIds(
            isAdding ? [...distributorIds, opt.id] : distributorIds.filter((id) => id !== opt.id),
          )
          setSelectedDistributors(
            isAdding
              ? [...selectedDistributors.filter((s) => s.id !== opt.id), opt]
              : selectedDistributors.filter((s) => s.id !== opt.id),
          )
        }}
        onClearDistributors={() => {
          setDistributorIds([])
          setSelectedDistributors([])
        }}
        cityIds={cityIds}
        selectedCities={selectedCities}
        onToggleCity={(opt) => {
          const isAdding = !cityIds.includes(opt.id)
          setCityIds(isAdding ? [...cityIds, opt.id] : cityIds.filter((id) => id !== opt.id))
          setSelectedCities(
            isAdding
              ? [...selectedCities.filter((s) => s.id !== opt.id), opt]
              : selectedCities.filter((s) => s.id !== opt.id),
          )
        }}
        onClearCities={() => {
          setCityIds([])
          setSelectedCities([])
        }}
        bonusFilter={bonusFilter}
        onBonusChange={setBonusFilter}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
      />
      <div className="relative min-h-0 flex-1 overflow-auto">
        <LoadingOverlay show={apiOffers.isLoading} label="Загрузка предложений…" />
        <SupplierTable
          offers={filteredOffers}
          avgPrice={avgPrice}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          visibleColumns={visibleColumns}
          startIndex={(page - 1) * pageSize}
        />
      </div>

      {apiOffers.data && 'totalCount' in apiOffers.data && apiOffers.data.totalCount > pageSize && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <Pagination
            page={apiOffers.data.pageNumber}
            totalPages={apiOffers.data.totalPages}
            totalCount={apiOffers.data.totalCount}
            pageSize={pageSize}
            hasPrevious={apiOffers.data.hasPrevious}
            hasNext={apiOffers.data.hasNext}
            isLoading={apiOffers.isLoading}
            onChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      )}
    </div>
  )
}
