import { useRef, useState, useEffect } from 'react'
import { Search, ChevronDown, X, Check, AlignJustify } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'

export type MedicineColumnKey = 'mnn' | 'stock' | 'needed'

interface MedicineFiltersProps {
  search: string
  onSearch: (value: string) => void
  selectedManufacturers: string[]
  onManufacturers: (values: string[]) => void
  manufacturers: string[]
  visibleColumns: Record<MedicineColumnKey, boolean>
  onToggleColumn: (key: MedicineColumnKey) => void
  columnOptions?: { key: MedicineColumnKey; label: string }[]
}

export function MedicineFilters({
  search, onSearch,
  selectedManufacturers, onManufacturers,
  manufacturers,
  visibleColumns, onToggleColumn,
  columnOptions,
}: MedicineFiltersProps) {
  const { t } = useTranslation()
  const resolvedColumnOptions = columnOptions ?? [{ key: 'mnn' as MedicineColumnKey, label: t('col_mnn') }]

  const [open, setOpen] = useState(false)
  const [openCols, setOpenCols] = useState(false)
  const colsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setOpenCols(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const [innerSearch, setInnerSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setInnerSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      setInnerSearch('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function toggleManufacturer(m: string) {
    onManufacturers(
      selectedManufacturers.includes(m)
        ? selectedManufacturers.filter((x) => x !== m)
        : [...selectedManufacturers, m]
    )
  }

  const hasSelected = selectedManufacturers.length > 0
  const filtered = manufacturers.filter((m) =>
    m.toLowerCase().includes(innerSearch.toLowerCase())
  )

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {/* Search */}
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('filter_search')}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Manufacturer multi-select */}
      <div ref={ref} className="relative min-w-0 flex-1">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-9 w-full items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
            open
              ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100'
              : hasSelected
                ? 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
          )}
        >
          <span className="flex-1 truncate text-left">
            {hasSelected ? `${t('filter_manufacturer')} · ${selectedManufacturers.length}` : t('filter_manufacturer')}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute left-0 top-10 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={innerSearch}
                  onChange={(e) => setInnerSearch(e.target.value)}
                  placeholder={t('filter_search_inner')}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-700"
                />
                {innerSearch && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setInnerSearch('') }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[216px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400">{t('filter_nothing_found')}</p>
              ) : (
                filtered.map((m) => {
                  const checked = selectedManufacturers.includes(m)
                  return (
                    <label
                      key={m}
                      onClick={() => toggleManufacturer(m)}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className={cn(
                        'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-gray-900 bg-gray-900 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 dark:border-gray-600'
                      )}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className="truncate text-sm text-gray-700 dark:text-gray-300">{m}</span>
                    </label>
                  )
                })
              )}
            </div>

            {hasSelected && (
              <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-800">
                <button
                  onClick={() => onManufacturers([])}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  {t('filter_reset_all')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column toggle */}
      <div ref={colsRef} className="relative shrink-0">
        <button
          onClick={() => setOpenCols(v => !v)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            openCols
              ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-400 dark:bg-gray-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300',
          )}
        >
          <AlignJustify className="h-4 w-4" />
        </button>
        {openCols && (
          <div className="absolute right-0 top-10 z-50 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('filter_columns_header')}</p>
            {resolvedColumnOptions.map(col => {
              const checked = visibleColumns[col.key]
              return (
                <label
                  key={col.key}
                  onClick={() => onToggleColumn(col.key)}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    checked ? 'border-gray-900 bg-gray-900 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 dark:border-gray-600',
                  )}>
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
  )
}
