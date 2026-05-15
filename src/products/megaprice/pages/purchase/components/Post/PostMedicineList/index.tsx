import { useState, useMemo, useEffect, useCallback } from 'react'
import { mockMedicines, mockPharmacies, mockSupplierOffers } from '@/products/megaprice/mocks/purchase.mocks'
import { mockPOSByPharmacy } from '@/products/megaprice/mocks/pos.mocks'
import { useFavorites } from '@/products/megaprice/pages/purchase/hooks/useFavorites'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import { AutoSelectModal } from '../../AutoSelect/AutoSelectModal'
import type { Medicine, Pharmacy, SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { AutoSelectBar } from './AutoSelectBar'
import type { VisibleCols } from './config'
import { DesktopTable } from './DesktopTable'
import { MobileList } from './MobileList'
import { Toolbar } from './Toolbar'

interface PostMedicineListProps {
  selectedMedicine: Medicine | null
  onSelect: (medicine: Medicine | null) => void
  showFavorites: boolean
}

export function PostMedicineList({ selectedMedicine, onSelect, showFavorites }: PostMedicineListProps) {
  const [search,      setSearch]      = useState('')
  const [pharmacy,    setPharmacy]    = useState<Pharmacy>(mockPharmacies[0])
  const [pharmOpen,   setPharmOpen]   = useState(false)
  const [checkedIds,  setCheckedIds]  = useState<string[]>([])
  const [byDemand,    setByDemand]    = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [colsOpen,    setColsOpen]    = useState(false)
  const [visibleCols, setVisibleCols] = useState<VisibleCols>({ stock: true, needed: true })

  const { isFavorite, toggle: toggleFavoriteByDrugId } = useFavorites()
  const { addItem } = usePurchaseCart()

  // Конверсия composite-id → drugId для API. У POS-mock данных drugId нет,
  // тогда вызов уходит в no-op (см. useFavorites — defensive check).
  const toggleFavorite = (medicineId: string) => {
    const med = mockMedicines.find((m) => m.id === medicineId)
    if (med?.drugId) toggleFavoriteByDrugId(med.drugId)
  }

  // Единая база избранного: legacy mock-флаги (m.isFavorite) + API-избранное.
  const allFavoriteIds = useMemo(() => {
    const mockFavIds = mockMedicines.filter((m) => m.isFavorite).map((m) => m.id)
    const apiFavIds = mockMedicines
      .filter((m) => m.drugId !== undefined && isFavorite(m.drugId))
      .map((m) => m.id)
    return Array.from(new Set([...mockFavIds, ...apiFavIds]))
  }, [isFavorite])

  // Объединяем POS-данные выбранной аптеки с полными данными о лекарствах
  const posRows = useMemo(() => {
    const pharmacyMedicines = mockPOSByPharmacy[pharmacy.id] ?? []
    return pharmacyMedicines
      .map((pos) => {
        const medicine = mockMedicines.find((m) => m.id === pos.id)
        if (!medicine) return null
        return { ...pos, medicine }
      })
      .filter(Boolean) as Array<(typeof pharmacyMedicines)[0] & { medicine: Medicine }>
  }, [pharmacy.id])

  const filtered = useMemo(() => {
    let list = posRows
    if (showFavorites) list = list.filter((r) => allFavoriteIds.includes(r.medicine.id))
    const q = search.toLowerCase().trim()
    if (!q) return list
    return list.filter(
      (r) =>
        r.medicine.name.toLowerCase().includes(q) ||
        r.medicine.manufacturer.toLowerCase().includes(q),
    )
  }, [posRows, showFavorites, allFavoriteIds, search])

  // Когда меняется аптека — сбрасываем чекбоксы
  useEffect(() => { setCheckedIds([]) }, [pharmacy.id])

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }, [])

  // Авто-подбор: добавляем в корзину с нужным количеством
  function handleAutoSelectConfirm(results: { medicine: Medicine; offer: SupplierOffer | null }[]) {
    results.forEach(({ medicine, offer }) => {
      if (!offer) return
      const posRow = posRows.find((r) => r.medicine.id === medicine.id)
      const qty = byDemand && posRow && posRow.needed > 0 ? posRow.needed : 1
      addItem({ offerId: offer.id, medicineId: medicine.id, quantity: qty, offer, medicine })
    })
    setCheckedIds([])
  }

  const checkedMedicines = useMemo(
    () => filtered.filter((r) => checkedIds.includes(r.medicine.id)).map((r) => r.medicine),
    [filtered, checkedIds],
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">

      <Toolbar
        search={search}
        setSearch={setSearch}
        pharmacy={pharmacy}
        setPharmacy={setPharmacy}
        pharmOpen={pharmOpen}
        setPharmOpen={setPharmOpen}
        visibleCols={visibleCols}
        setVisibleCols={setVisibleCols}
        colsOpen={colsOpen}
        setColsOpen={setColsOpen}
      />

      <MobileList
        filtered={filtered}
        selectedMedicine={selectedMedicine}
        checkedIds={checkedIds}
        allFavoriteIds={allFavoriteIds}
        visibleCols={visibleCols}
        onSelect={onSelect}
        onToggleCheck={toggleCheck}
        onToggleFavorite={toggleFavorite}
      />

      <DesktopTable
        filtered={filtered}
        selectedMedicine={selectedMedicine}
        checkedIds={checkedIds}
        allFavoriteIds={allFavoriteIds}
        visibleCols={visibleCols}
        onSelect={onSelect}
        onToggleCheck={toggleCheck}
        onToggleFavorite={toggleFavorite}
      />

      {checkedIds.length >= 2 && (
        <AutoSelectBar
          selectedCount={checkedIds.length}
          byDemand={byDemand}
          setByDemand={setByDemand}
          onOpenModal={() => setShowModal(true)}
        />
      )}

      {showModal && (
        <AutoSelectModal
          medicines={checkedMedicines}
          offers={mockSupplierOffers}
          onClose={() => setShowModal(false)}
          onConfirm={handleAutoSelectConfirm}
        />
      )}

    </div>
  )
}
