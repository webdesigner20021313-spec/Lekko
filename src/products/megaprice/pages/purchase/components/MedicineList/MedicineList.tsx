import { useState, useMemo, useRef, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MedicineFilters, type MedicineColumnKey } from './MedicineFilters'
import { MedicineTable } from './MedicineTable'
import { ExcelUploadView } from './ExcelUploadView'
import { PostMedicineList } from '../Post/PostMedicineList'
import { mockMedicines, mockPosItems } from '@/products/megaprice/mocks/purchase.mocks'
import { useFavorites } from '@/products/megaprice/pages/purchase/hooks/useFavorites'
import { useCart, useDrugSearch } from '@/products/megaprice/api/hooks'
import { mapDrugRowToMedicine } from '@/products/megaprice/api/adapters'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { Pagination } from '@/shared/ui-kit/Pagination'
import { LoadingOverlay } from '@/shared/ui-kit/LoadingOverlay'
import type { ManufacturerOption } from './MedicineFilters'
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
  /** Колбэк с full Medicine[] актуальных чекнутых строк (resolved из baseList).
   * Нужен AutoSelect-модалке, чтобы получить drugId/manufacturer реальных medicines —
   * родитель сам не может это сделать (он не знает API-список). */
  onCheckedMedicinesChange?: (medicines: Medicine[]) => void
}

export function MedicineList({
  activeTab,
  selectedMedicine,
  onSelect,
  checkedIds,
  onToggleCheck,
  showFavorites,
  onAutoSelect,
  onCheckedMedicinesChange,
}: MedicineListProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  // Multi-select производителей: храним producer-IDs (стабильно, без зависимости
  // от регистра/локали имён). Бэк применяет WHERE producer_id IN (...).
  const [manufacturerIds, setManufacturerIds] = useState<number[]>([])
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

  const { isFavorite, toggle: toggleFavoriteByDrugId } = useFavorites()
  // Реальная корзина (backend) — индексируем по drugId, т.к. CartItem из API
  // имеет drugId:number, а medicine.id — composite-string. Mock-стор Zustand
  // (usePurchaseCart) больше не используется здесь — он отдавал demoCart-данные
  // и бейдж всегда был 0 для реально добавленных позиций.
  const cart = useCart()
  const cartQtyByDrugId = useMemo(() => {
    const map: Record<number, number> = {}
    cart.data?.items?.forEach((it) => {
      map[it.drugId] = (map[it.drugId] ?? 0) + it.quantity
    })
    return map
  }, [cart.data?.items])

  // Compat-слой для MedicineTable/MedicineRow: они работают с composite-id
  // (`${drugId}::${manufacturer}`), а API хранит чистый drug_id. Здесь
  // конвертируем — отдаём вниз только composite-id из текущего списка.

  // ── Backend search для manual-вкладки ──────────────────────────────
  // POS-вкладка живёт на mock'ах (своя структура — позиции склада).
  // Manual-вкладка идёт через /api/drugsearch/search; debounce встроен в хук.
  const isApiDriven = activeTab === 'manual'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Имена выбранных производителей — кэш на стороне MedicineList. Заполняется
  // когда юзер выбирает в dropdown'е (server-side). Нужен для UI: чтобы при
  // pagination/смене query внутри dropdown'а ✓ оставались на выбранных.
  const [selectedManufacturers, setSelectedManufacturers] = useState<ManufacturerOption[]>([])

  // Стабильный ключ для useEffect-зависимости — без него каждый ре-рендер
  // создавал новый массив и триггерил лишний refetch.
  const producerIdsKey = manufacturerIds.slice().sort((a, b) => a - b).join(',')

  // Сбрасываем page=1 при смене query/фильтра/тоггла избранных.
  useEffect(() => {
    setPage(1)
  }, [search, producerIdsKey, showFavorites])

  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  // Дебаунс search — иначе каждое нажатие клавиши = отдельный POST к бэку.
  const debouncedSearch = useDebouncedValue(search, 300)
  const apiSearch = useDrugSearch({
    drugStoreId,
    drugName: isApiDriven ? debouncedSearch : '',
    producerIds: isApiDriven && manufacturerIds.length > 0 ? manufacturerIds : null,
    favoritesOnly: isApiDriven && showFavorites,
    page,
    pageSize: pageSize,
    enabled: isApiDriven,
  })

  const apiMedicines = useMemo<Medicine[]>(() => {
    if (!isApiDriven) return []
    const items =
      apiSearch.data && 'items' in apiSearch.data ? apiSearch.data.items : []
    return items.map((row) => mapDrugRowToMedicine(row))
  }, [isApiDriven, apiSearch.data])

  const baseList = useMemo<Medicine[]>(() => {
    if ((activeTab as string) === 'pos') return mockPosItems
    if (isApiDriven) return apiMedicines
    return mockMedicines
  }, [activeTab, isApiDriven, apiMedicines])

  // Аккумулируем чекнутые Medicine'ы поверх страниц: id может чекнуться на page=1,
  // потом юзер переходит на page=2 (baseList уже другой), но medicine надо помнить.
  // Map<id, Medicine> — single source of truth для AutoSelect модалки.
  const [checkedMap, setCheckedMap] = useState<Map<string, Medicine>>(new Map())
  useEffect(() => {
    setCheckedMap((prev) => {
      const next = new Map(prev)
      // Добавляем новых из baseList'а если они в checkedIds.
      baseList.forEach((m) => {
        if (checkedIds.includes(m.id) && !next.has(m.id)) next.set(m.id, m)
      })
      // Удаляем тех кого uncheck'нули.
      next.forEach((_, id) => { if (!checkedIds.includes(id)) next.delete(id) })
      return next
    })
  }, [baseList, checkedIds])
  useEffect(() => {
    onCheckedMedicinesChange?.(Array.from(checkedMap.values()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedMap])

  // Mock-вкладки (POS/Excel/Post) больше не имеют manufacturer-фильтра —
  // это server-side фича через ManufacturerDropdown, привязанная к API.
  // Если понадобится — отдельный mock-dropdown в UI этих вкладок.

  const filteredList = useMemo(() => {
    let list = baseList
    // В API-режиме ВСЕ фильтры (включая favoritesOnly) обрабатывает бэк — фронт только рисует.
    // В mock-режиме (POS/Excel/Post) фильтрация client-side: showFavorites + поиск по имени.
    if (!isApiDriven) {
      if (showFavorites) list = list.filter((m) => isFavorite(m.drugId))
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(
          (m) => m.name.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q),
        )
      }
    }
    return list
  }, [baseList, isApiDriven, showFavorites, search, isFavorite])

  // Composite-id-ы текущего списка, которые сейчас в избранном —
  // нужно для MedicineTable/MedicineRow (они оперируют id, а не drugId).
  const favoriteIdsInList = useMemo(
    () => filteredList.filter((m) => isFavorite(m.drugId)).map((m) => m.id),
    [filteredList, isFavorite],
  )

  // Конвертим composite-id в drugId и зовём API.
  const handleToggleFavorite = (medicineId: string) => {
    const med = filteredList.find((m) => m.id === medicineId)
    if (med?.drugId) toggleFavoriteByDrugId(med.drugId)
  }

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
          cartQtyByDrugId={cartQtyByDrugId}
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
          selectedManufacturerIds={manufacturerIds}
          selectedManufacturers={selectedManufacturers}
          onToggleManufacturer={(opt) => {
            const isAdding = !manufacturerIds.includes(opt.id)
            setManufacturerIds(
              isAdding
                ? [...manufacturerIds, opt.id]
                : manufacturerIds.filter((id) => id !== opt.id),
            )
            setSelectedManufacturers(
              isAdding
                ? [...selectedManufacturers.filter((s) => s.id !== opt.id), opt]
                : selectedManufacturers.filter((s) => s.id !== opt.id),
            )
          }}
          onClearManufacturers={() => {
            setManufacturerIds([])
            setSelectedManufacturers([])
          }}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
        />
      </div>

      {/* Таблица — скролл по X и Y только на десктопе; на мобиле — карточки без X-скролла */}
      <div
        ref={panel1Ref}
        className="relative min-h-0 flex-1 overflow-y-scroll md:overflow-x-scroll"
      >
        <LoadingOverlay show={isApiDriven && apiSearch.isLoading} label="Загрузка…" />
        <MedicineTable
          medicines={filteredList}
          selectedId={selectedMedicine?.id ?? null}
          onSelect={onSelect}
          checkedIds={checkedIds}
          onToggleCheck={onToggleCheck}
          favoriteIds={favoriteIdsInList}
          onToggleFavorite={handleToggleFavorite}
          cartQtyByDrugId={cartQtyByDrugId}
          panel1Width={panel1Width}
          showMnn={visibleColumns.mnn}
          startIndex={isApiDriven ? (page - 1) * pageSize : 0}
        />
      </div>

      {isApiDriven && apiSearch.data && apiSearch.data.totalCount > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <Pagination
            page={apiSearch.data.pageNumber}
            totalPages={apiSearch.data.totalPages}
            totalCount={apiSearch.data.totalCount}
            pageSize={pageSize}
            hasPrevious={apiSearch.data.hasPrevious}
            hasNext={apiSearch.data.hasNext}
            isLoading={apiSearch.isLoading}
            onChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      )}

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
