import { useRef, useEffect } from 'react'
import { Search, Building2, ChevronDown, AlignJustify, Check } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { mockPharmacies } from '@/products/megaprice/mocks/purchase.mocks'
import type { Pharmacy } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { VisibleCols } from '../config'

/** Шапка PostMedicineList: search + pharmacy-picker + columns toggle. */
export function Toolbar({
  search,
  setSearch,
  pharmacy,
  setPharmacy,
  pharmOpen,
  setPharmOpen,
  visibleCols,
  setVisibleCols,
  colsOpen,
  setColsOpen,
}: {
  search: string
  setSearch: (v: string) => void
  pharmacy: Pharmacy
  setPharmacy: (p: Pharmacy) => void
  pharmOpen: boolean
  setPharmOpen: (v: boolean | ((p: boolean) => boolean)) => void
  visibleCols: VisibleCols
  setVisibleCols: (next: VisibleCols | ((p: VisibleCols) => VisibleCols)) => void
  colsOpen: boolean
  setColsOpen: (v: boolean | ((p: boolean) => boolean)) => void
}) {
  const pharmRef = useRef<HTMLDivElement>(null)
  const colsRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pharmRef.current && !pharmRef.current.contains(e.target as Node)) setPharmOpen(false)
      if (colsRef.current  && !colsRef.current.contains(e.target as Node))  setColsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setPharmOpen, setColsOpen])

  return (
    <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
      <div className="flex items-stretch gap-2">

        {/* Поиск */}
        <div className="relative h-9 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-400 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500"
          />
        </div>

        {/* Выбор аптеки */}
        <div ref={pharmRef} className="relative h-9 flex-1" style={{ minWidth: 0 }}>
          <button
            onClick={() => setPharmOpen((v) => !v)}
            className={cn(
              'flex h-full w-full items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
              pharmOpen
                ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-[#222222] dark:text-gray-100'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:border-gray-600',
            )}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-left">{pharmacy.name}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', pharmOpen && 'rotate-180')} />
          </button>

          {pharmOpen && (
            <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">
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
                      isActive ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600',
                    )}>
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{ph.name}</p>
                      <p className="truncate text-xs text-gray-400 dark:text-[#929292]">{ph.city}, {ph.address}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Columns toggle */}
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
            <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">Столбцы</p>
              {([
                { key: 'stock',  label: 'Остаток'     },
                { key: 'needed', label: 'Потребность'  },
              ] as const).map(col => {
                const checked = visibleCols[col.key]
                return (
                  <label key={col.key} onClick={() => setVisibleCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600')}>
                      {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
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
  )
}
