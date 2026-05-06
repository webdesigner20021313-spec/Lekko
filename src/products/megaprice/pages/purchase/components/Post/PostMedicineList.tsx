import { useState, useMemo, useRef, useEffect, useCallback } from 'react'

import { Search, Check, ChevronDown, Heart, Building2, Zap, AlignJustify } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { mockMedicines, mockPharmacies, mockSupplierOffers } from '@/products/megaprice/mocks/purchase.mocks'
import { mockPOSByPharmacy } from '@/products/megaprice/mocks/pos.mocks'
import { useFavorites } from '@/products/megaprice/pages/purchase/hooks/useFavorites'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import { AutoSelectModal } from '../AutoSelect/AutoSelectModal'
import type { Medicine, Pharmacy, SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'

const ROW_H    = 56
const COL_CB   = 40
const COL_FAV  = 56
const COL_STOCK  = 82
const COL_NEEDED = 130

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
  const [visibleCols, setVisibleCols] = useState({ stock: true, needed: true })
  const pharmRef  = useRef<HTMLDivElement>(null)
  const colsRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setColsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const tableRef  = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(500)

  useEffect(() => {
    if (!tableRef.current) return
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width))
    ro.observe(tableRef.current)
    return () => ro.disconnect()
  }, [])

  // Название — min 400px, резиновый
  const extraW = (visibleCols.stock ? COL_STOCK : 0) + (visibleCols.needed ? COL_NEEDED : 0)
  const nameW  = Math.max(400, containerW - COL_CB - extraW - COL_FAV)
  const tableW = Math.max(400 + COL_CB + extraW + COL_FAV, containerW)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pharmRef.current && !pharmRef.current.contains(e.target as Node)) setPharmOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { favoriteIds, toggleFavorite } = useFavorites()
  const { addItem } = usePurchaseCart()

  // Единая база избранного: из моков + из хука
  const allFavoriteIds = useMemo(() => {
    const mockFavIds = mockMedicines.filter((m) => m.isFavorite).map((m) => m.id)
    return Array.from(new Set([...mockFavIds, ...favoriteIds]))
  }, [favoriteIds])

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

  function toggleCheck(id: string) {
    setCheckedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  // Select all
  const allChecked  = filtered.length > 0 && filtered.every((r) => checkedIds.includes(r.medicine.id))
  const someChecked = !allChecked && filtered.some((r) => checkedIds.includes(r.medicine.id))
  const headerCbRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someChecked
  }, [someChecked])

  const handleSelectAll = useCallback(() => {
    if (allChecked) {
      setCheckedIds((prev) => prev.filter((id) => !filtered.some((r) => r.medicine.id === id)))
    } else {
      const newIds = filtered.map((r) => r.medicine.id)
      setCheckedIds((prev) => Array.from(new Set([...prev, ...newIds])))
    }
  }, [allChecked, filtered])

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

      {/* Поиск + Выбор аптеки */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-stretch gap-2">

          {/* Поиск */}
          <div className="relative h-9 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500"
            />
          </div>

          {/* Выбор аптеки */}
          <div ref={pharmRef} className="relative h-9 flex-1" style={{ minWidth: 0 }}>
            <button
              onClick={() => setPharmOpen((v) => !v)}
              className={cn(
                'flex h-full w-full items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
                pharmOpen
                  ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600',
              )}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="flex-1 truncate text-left">{pharmacy.name}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', pharmOpen && 'rotate-180')} />
            </button>

            {pharmOpen && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Аптека
                </p>
                {mockPharmacies.map((ph) => {
                  const isActive = ph.id === pharmacy.id
                  return (
                    <button
                      key={ph.id}
                      onClick={() => { setPharmacy(ph); setPharmOpen(false) }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                        isActive ? 'border-gray-900 bg-gray-900 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 dark:border-gray-600',
                      )}>
                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{ph.name}</p>
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{ph.city}, {ph.address}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Column toggle */}
          <div ref={colsRef} className="relative shrink-0">
            <button
              onClick={() => setColsOpen(v => !v)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                colsOpen ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-400 dark:bg-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300',
              )}
            >
              <AlignJustify className="h-4 w-4" />
            </button>
            {colsOpen && (
              <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Столбцы</p>
                {([
                  { key: 'stock',  label: 'Остаток'     },
                  { key: 'needed', label: 'Потребность'  },
                ] as const).map(col => {
                  const checked = visibleCols[col.key]
                  return (
                    <label key={col.key} onClick={() => setVisibleCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-gray-900 bg-gray-900 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 dark:border-gray-600')}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div ref={tableRef} className="flex-1 overflow-x-auto overflow-y-auto">
        <table style={{ tableLayout: 'fixed', width: tableW, borderCollapse: 'collapse' }}>
          <colgroup>
            <col style={{ width: COL_CB }} />
            <col style={{ width: nameW }} />
            {visibleCols.stock  && <col style={{ width: COL_STOCK }} />}
            {visibleCols.needed && <col style={{ width: COL_NEEDED }} />}
            <col style={{ width: COL_FAV }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{
                position: 'sticky', top: 0, zIndex: 2, height: 48,
                background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)',
                padding: 0,
              }}>
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    ref={headerCbRef}
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                  />
                </div>
              </th>
              <th style={{
                position: 'sticky', top: 0, zIndex: 2, height: 48,
                background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)',
                padding: '0 12px', textAlign: 'left', overflow: 'hidden',
              }}>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Название</span>
              </th>
              {visibleCols.stock && (
                <th style={{ position: 'sticky', top: 0, zIndex: 2, height: 48, background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)', padding: '0 12px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Остаток</span>
                </th>
              )}
              {visibleCols.needed && (
                <th style={{ position: 'sticky', top: 0, zIndex: 2, height: 48, background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)', padding: '0 16px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Потребность</span>
                </th>
              )}
              {/* Heart header — sticky right */}
              <th style={{
                position: 'sticky', top: 0, right: 0, zIndex: 4, height: 48,
                background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)',
                boxShadow: '-1px 0 0 var(--table-cell-border)', padding: 0,
              }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={2 + (visibleCols.stock ? 1 : 0) + (visibleCols.needed ? 1 : 0) + 1} className="py-10 text-center text-sm text-gray-400">
                  Ничего не найдено
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isSelected = selectedMedicine?.id === row.medicine.id
                const isChecked  = checkedIds.includes(row.medicine.id)
                const isFav      = allFavoriteIds.includes(row.medicine.id)

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelect(isSelected ? null : row.medicine)}
                    className={cn(
                      'group cursor-pointer border-b border-gray-100 transition-colors dark:border-gray-800',
                      isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800',
                    )}
                  >
                    {/* Checkbox (батч) + индикатор выбора */}
                    <td className="relative w-10 px-3 py-0">
                      {isSelected && (
                        <span style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: 3, background: 'var(--selection-indicator)', borderRadius: '0 2px 2px 0',
                        }} />
                      )}
                      <div className="flex h-14 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          onClick={(e) => { e.stopPropagation(); toggleCheck(row.medicine.id) }}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                        />
                      </div>
                    </td>

                    {/* Название / Производитель */}
                    <td className="px-3 py-0">
                      <div className="flex h-14 flex-col justify-center overflow-hidden">
                        <p className={cn(
                          'truncate text-sm',
                          isSelected ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-900 dark:text-gray-100',
                        )}>
                          {row.medicine.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                          {row.medicine.manufacturer} · {row.medicine.country}
                        </p>
                      </div>
                    </td>

                    {/* Остаток */}
                    {visibleCols.stock && (
                      <td className="whitespace-nowrap px-3 py-0 text-right">
                        <span className={cn('text-sm tabular-nums font-medium', row.stock === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300')}>
                          {row.stock === 0 ? '—' : row.stock}
                        </span>
                      </td>
                    )}

                    {/* Потребность */}
                    {visibleCols.needed && (
                      <td className="px-4 py-0 text-right">
                        {row.needed > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]">
                            +{row.needed} нужно
                          </span>
                        ) : row.excess > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]">
                            −{row.excess} лишних
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-xs font-semibold text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]">
                            <Check className="h-3 w-3" />
                            Достаточно
                          </span>
                        )}
                      </td>
                    )}

                    {/* Избранное — sticky right */}
                    <td
                      style={{
                        position: 'sticky', right: 0, zIndex: 2,
                        width: 56, padding: 0,
                        boxShadow: '-1px 0 0 var(--table-cell-border)',
                      }}
                      className={cn(
                        'transition-colors',
                        isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-800',
                      )}
                    >
                      <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(row.medicine.id) }}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
                            isFav
                              ? 'border-amber-400 bg-amber-50 text-amber-400 dark:bg-amber-900/30'
                              : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 dark:border-gray-700 dark:hover:border-gray-400 dark:hover:text-gray-200',
                          )}
                        >
                          <Heart className={cn('h-4 w-4', isFav && 'fill-amber-400')} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Авто-подбор — появляется при 2+ отмеченных */}
      {checkedIds.length >= 2 && (
        <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Выбрано: <span className="font-semibold text-gray-900 dark:text-gray-100">{checkedIds.length}</span>
          </span>

          <div className="flex items-center gap-3">
            {/* Переключатель «По требованию» */}
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <span className="text-sm text-gray-600 dark:text-gray-400">По требованию</span>
              <button
                type="button"
                role="switch"
                aria-checked={byDemand}
                onClick={() => setByDemand((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full border-2 transition-colors duration-200',
                  byDemand ? 'border-gray-900 bg-gray-900 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700',
                )}
              >
                <span className={cn(
                  'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-200',
                  byDemand ? 'translate-x-4' : 'translate-x-0.5',
                )} />
              </button>
            </label>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              <Zap className="h-4 w-4" />
              Авто-подбор
            </button>
          </div>
        </div>
      )}

      {/* Модалка авто-подбора */}
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
