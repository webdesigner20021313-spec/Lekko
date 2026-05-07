import { useState, useMemo, useRef, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MedicineFilters, type MedicineColumnKey } from './MedicineFilters'
import { MedicineTable } from './MedicineTable'
import { ExcelUploadView } from './ExcelUploadView'
import { PostMedicineList } from '../Post/PostMedicineList'
import { mockMedicines, mockPosItems } from '@/products/megaprice/mocks/purchase.mocks'
import { useFavorites } from '@/products/megaprice/pages/purchase/hooks/useFavorites'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { PurchaseTab } from '@/products/megaprice/pages/purchase/PurchasePage'

interface MedicineListProps {
  activeTab: PurchaseTab
  selectedMedicine: Medicine | null
  onSelect: (medicine: Medicine) => void
  checkedIds: string[]
  onToggleCheck: (id: string) => void
  showFavorites: boolean
  onAutoSelect: () => void
}

export function MedicineList({
  activeTab,
  selectedMedicine,
  onSelect,
  checkedIds,
  onToggleCheck,
  showFavorites,
  onAutoSelect,
}: MedicineListProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([])
  const [excelMedicines, setExcelMedicines] = useState<Medicine[]>([])
  const [visibleColumns, setVisibleColumns] = useState<Record<MedicineColumnKey, boolean>>({ mnn: true, stock: false, needed: false })

  function toggleColumn(key: MedicineColumnKey) {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const panel1Ref = useRef<HTMLDivElement>(null)
  const [panel1Width, setPanel1Width] = useState(640)

  useEffect(() => {
    if (!panel1Ref.current) return
    const ro = new ResizeObserver(entries => {
      setPanel1Width(entries[0].contentRect.width)
    })
    ro.observe(panel1Ref.current)
    return () => ro.disconnect()
  }, [])

  const { favoriteIds, toggleFavorite } = useFavorites()
  const cartItems = usePurchaseCart((s) => s.items)

  const cartQtyByMedicine = useMemo(() => {
    const map: Record<string, number> = {}
    cartItems.forEach((item) => {
      map[item.medicineId] = (map[item.medicineId] ?? 0) + item.quantity
    })
    return map
  }, [cartItems])

  const allFavoriteIds = useMemo(() => {
    const mockFavIds = mockMedicines.filter((m) => m.isFavorite).map((m) => m.id)
    return Array.from(new Set([...mockFavIds, ...favoriteIds]))
  }, [favoriteIds])

  const baseList = useMemo(() => {
    if ((activeTab as string) === 'pos') return mockPosItems
    return mockMedicines
  }, [activeTab])

  const filteredList = useMemo(() => {
    let list = baseList
    if (showFavorites) list = list.filter((m) => allFavoriteIds.includes(m.id))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q)
      )
    }
    if (manufacturerFilter.length) list = list.filter((m) => manufacturerFilter.includes(m.manufacturer))
    return list
  }, [baseList, showFavorites, allFavoriteIds, search, manufacturerFilter])

  const manufacturers = useMemo(
    () => Array.from(new Set(mockMedicines.map((m) => m.manufacturer))).sort(),
    []
  )

  // Post tab
  if (activeTab === 'post') {
    return (
      <PostMedicineList
        selectedMedicine={selectedMedicine}
        onSelect={(med) => med && onSelect(med)}
        showFavorites={showFavorites}
      />
    )
  }

  // Excel tab
  if (activeTab === 'excel') {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ExcelUploadView
          medicines={excelMedicines}
          catalogMedicines={mockMedicines}
          onMedicinesLoaded={setExcelMedicines}
          selectedId={selectedMedicine?.id ?? null}
          onSelect={onSelect}
          checkedIds={checkedIds}
          onToggleCheck={onToggleCheck}
          cartQtyByMedicine={cartQtyByMedicine}
        />
        {checkedIds.length >= 2 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('selected_label')} <span className="font-semibold text-gray-900 dark:text-gray-100">{checkedIds.length}</span>
            </span>
            <button
              onClick={onAutoSelect}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <Zap className="h-4 w-4" />
              {t('autoselect_btn')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Manual / POS tabs
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
        <MedicineFilters
          search={search}
          onSearch={setSearch}
          selectedManufacturers={manufacturerFilter}
          onManufacturers={setManufacturerFilter}
          manufacturers={manufacturers}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
        />
      </div>

      {/* Таблица — скролл по X и Y только на десктопе; на мобиле — карточки без X-скролла */}
      <div
        ref={panel1Ref}
        className="min-h-0 flex-1 overflow-y-scroll md:overflow-x-scroll"
      >
        <MedicineTable
          medicines={filteredList}
          selectedId={selectedMedicine?.id ?? null}
          onSelect={onSelect}
          checkedIds={checkedIds}
          onToggleCheck={onToggleCheck}
          favoriteIds={allFavoriteIds}
          onToggleFavorite={toggleFavorite}
          cartQtyByMedicine={cartQtyByMedicine}
          panel1Width={panel1Width}
          showMnn={visibleColumns.mnn}
        />
      </div>

      {/* Авто-подбор — показывается когда выбрано 2+ */}
      {checkedIds.length >= 2 && (
        <div className="flex-shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Выбрано: <span className="font-semibold text-gray-900 dark:text-gray-100">{checkedIds.length}</span>
          </span>
          <button
            onClick={onAutoSelect}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Zap className="h-4 w-4" />
            Авто-подбор
          </button>
        </div>
      )}
    </div>
  )
}
