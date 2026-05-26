import { useState, useMemo, useEffect } from 'react'
import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SupplierFilters } from './SupplierFilters'
import { SupplierTable } from './SupplierTable'
import { mockSupplierOffers } from '@/products/megaprice/mocks/purchase.mocks'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import type { Medicine, SortField, SortDirection, BonusType, ColumnKey } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface SupplierOffersProps {
  medicine: Medicine | null
  /** Controlled-режим мобильного фильтр-sheet'а (открывается из глобального Header-action). */
  mobileFiltersOpen?: boolean
  onMobileFiltersOpenChange?: (open: boolean) => void
  /** Сообщает наружу количество активных фильтров (для indicator на header-action). */
  onFilterCountChange?: (count: number) => void
}

export function SupplierOffers({
  medicine,
  mobileFiltersOpen,
  onMobileFiltersOpenChange,
  onFilterCountChange,
}: SupplierOffersProps) {
  const { t } = useTranslation()
  const [distributorFilter, setDistributorFilter] = useState<string[]>([])
  const [cityFilter, setCityFilter] = useState<string[]>([])
  const [bonusFilter, setBonusFilter] = useState<BonusType[]>([])
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    expiry: true, payment: true, price: true, bonus: true, quantity: true,
  })

  function handleToggleColumn(key: ColumnKey) {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const { addItem, removeItem } = usePurchaseCart()

  useEffect(() => {
    setDistributorFilter([])
    setCityFilter([])
    setBonusFilter([])
  }, [medicine?.id])

  // Сообщаем наружу количество активных фильтров (для indicator на header-action)
  useEffect(() => {
    onFilterCountChange?.(distributorFilter.length + cityFilter.length + bonusFilter.length)
  }, [distributorFilter.length, cityFilter.length, bonusFilter.length, onFilterCountChange])

  const offersForMedicine = useMemo(() => {
    if (!medicine) return []
    return mockSupplierOffers.filter((o) => o.medicineId === medicine.id)
  }, [medicine])

  // Средняя цена для сравнения
  const avgPrice = useMemo(() => {
    if (!offersForMedicine.length) return 0
    return offersForMedicine.reduce((sum, o) => sum + o.priceWithVat, 0) / offersForMedicine.length
  }, [offersForMedicine])

  const distributors = useMemo(
    () => Array.from(new Set(offersForMedicine.map((o) => o.distributor.name))).sort(),
    [offersForMedicine]
  )

  const cities = useMemo(
    () => Array.from(new Set(offersForMedicine.map((o) => o.distributor.city))).sort(),
    [offersForMedicine]
  )

  const filteredOffers = useMemo(() => {
    let list = offersForMedicine
    if (distributorFilter.length) list = list.filter((o) => distributorFilter.includes(o.distributor.name))
    if (cityFilter.length) list = list.filter((o) => cityFilter.includes(o.distributor.city))
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
  }, [offersForMedicine, distributorFilter, cityFilter, bonusFilter, sortField, sortDir])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function handleQuantityChange(offerId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [offerId]: qty }))
    const offer = offersForMedicine.find((o) => o.id === offerId)
    if (!offer || !medicine) return
    if (qty <= 0) {
      removeItem(offerId)
    } else {
      addItem({ offerId, medicineId: medicine.id, quantity: qty, offer, medicine })
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
        distributorFilter={distributorFilter}
        onDistributor={setDistributorFilter}
        cityFilter={cityFilter}
        onCity={setCityFilter}
        bonusFilter={bonusFilter}
        onBonus={setBonusFilter}
        distributors={distributors}
        cities={cities}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        mobileSheetOpen={mobileFiltersOpen}
        onMobileSheetOpenChange={onMobileFiltersOpenChange}
      />
      <div className="min-h-0 flex-1">
        <SupplierTable
          offers={filteredOffers}
          avgPrice={avgPrice}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          visibleColumns={visibleColumns}
        />
      </div>
    </div>
  )
}
