import { useRef, useEffect, useState, useCallback } from 'react'
import { Heart, Check } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { COL_CB, COL_FAV, COL_NEEDED, COL_STOCK, ROW_H, type VisibleCols } from '../config'

interface PosRow {
  id: string
  medicine: Medicine
  stock: number
  needed: number
  excess: number
}

export function DesktopTable({
  filtered,
  selectedMedicine,
  checkedIds,
  allFavoriteIds,
  visibleCols,
  onSelect,
  onToggleCheck,
  onToggleFavorite,
}: {
  filtered: PosRow[]
  selectedMedicine: Medicine | null
  checkedIds: string[]
  allFavoriteIds: string[]
  visibleCols: VisibleCols
  onSelect: (m: Medicine | null) => void
  onToggleCheck: (id: string) => void
  onToggleFavorite: (id: string) => void
}) {
  const tableRef = useRef<HTMLDivElement>(null)
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

  // Select all
  const allChecked  = filtered.length > 0 && filtered.every((r) => checkedIds.includes(r.medicine.id))
  const someChecked = !allChecked && filtered.some((r) => checkedIds.includes(r.medicine.id))
  const headerCbRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someChecked
  }, [someChecked])

  const handleSelectAll = useCallback(() => {
    if (allChecked) filtered.forEach(r => onToggleCheck(r.medicine.id))
    else filtered.filter(r => !checkedIds.includes(r.medicine.id)).forEach(r => onToggleCheck(r.medicine.id))
  }, [allChecked, filtered, checkedIds, onToggleCheck])

  return (
    <div ref={tableRef} className="hidden md:block flex-1 overflow-x-auto overflow-y-auto">
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
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">Название</span>
            </th>
            {visibleCols.stock && (
              <th style={{ position: 'sticky', top: 0, zIndex: 2, height: 48, background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)', padding: '0 12px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">Остаток</span>
              </th>
            )}
            {visibleCols.needed && (
              <th style={{ position: 'sticky', top: 0, zIndex: 2, height: 48, background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)', padding: '0 16px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">Потребность</span>
              </th>
            )}
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
                    'group cursor-pointer border-b border-gray-100 transition-colors dark:border-[#333333]',
                    isSelected ? 'bg-gray-100 dark:bg-[#222222]' : 'bg-white hover:bg-gray-50 dark:bg-[#111111] dark:hover:bg-gray-800',
                  )}
                >
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
                        onClick={(e) => { e.stopPropagation(); onToggleCheck(row.medicine.id) }}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                      />
                    </div>
                  </td>

                  <td className="px-3 py-0">
                    <div className="flex h-14 flex-col justify-center overflow-hidden">
                      <p className={cn(
                        'truncate text-sm',
                        isSelected ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-900 dark:text-gray-100',
                      )}>
                        {row.medicine.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-[#929292]">
                        {row.medicine.manufacturer} · {row.medicine.country}
                      </p>
                    </div>
                  </td>

                  {visibleCols.stock && (
                    <td className="whitespace-nowrap px-3 py-0 text-right">
                      <span className={cn('text-sm tabular-nums font-medium', row.stock === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300')}>
                        {row.stock === 0 ? '—' : row.stock}
                      </span>
                    </td>
                  )}

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

                  <td
                    style={{
                      position: 'sticky', right: 0, zIndex: 2,
                      width: 56, padding: 0,
                      boxShadow: '-1px 0 0 var(--table-cell-border)',
                    }}
                    className={cn(
                      'transition-colors',
                      isSelected ? 'bg-gray-100 dark:bg-[#222222]' : 'bg-white group-hover:bg-gray-50 dark:bg-[#111111] dark:group-hover:bg-gray-800',
                    )}
                  >
                    <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(row.medicine.id) }}
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
  )
}
