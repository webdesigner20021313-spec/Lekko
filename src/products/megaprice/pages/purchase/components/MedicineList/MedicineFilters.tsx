import { useRef, useState, useEffect } from 'react'
import { Search, ChevronDown, X, Check, AlignJustify, SlidersHorizontal } from 'lucide-react'
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
  const [mobileSheet, setMobileSheet] = useState(false)
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
    <>
    {/* Mobile: search + filter button */}
    <div className="md:hidden flex items-center gap-2 px-4 py-3">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('filter_search')}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder:text-gray-500"
        />
        {search && (
          <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        onClick={() => setMobileSheet(true)}
        className={cn(
          'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
          hasSelected
            ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
            : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400',
        )}
      >
        <SlidersHorizontal className="h-5 w-5" />
        {hasSelected && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#111111]" />
        )}
      </button>
    </div>

    {mobileSheet && (
      <div className="fixed inset-0 z-50 md:hidden">
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setMobileSheet(false)} />
        <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-[#111111]">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('filter_manufacturer')}</h2>
            <button onClick={() => setMobileSheet(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="shrink-0 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={innerSearch}
                onChange={(e) => setInnerSearch(e.target.value)}
                placeholder={t('filter_search_inner')}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-base outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">{t('filter_nothing_found')}</p>
            ) : (
              <div className="space-y-1.5">
                {filtered.map(m => {
                  const checked = selectedManufacturers.includes(m)
                  return (
                    <label key={m} onClick={() => toggleManufacturer(m)}
                      className={cn('flex h-12 items-center gap-3 rounded-xl border px-3.5',
                        checked ? 'border-gray-900 bg-gray-50 dark:border-[#f1f1f1] dark:bg-[#222222]' : 'border-gray-200 dark:border-gray-700')}>
                      <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2', checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1]' : 'border-gray-300 dark:border-gray-600')}>
                        {checked && <Check className="h-3.5 w-3.5 text-white dark:text-gray-900" strokeWidth={3} />}
                      </div>
                      <span className={cn('truncate text-sm', checked ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300')}>{m}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          <div className="shrink-0 flex gap-3 border-t border-gray-100 px-5 py-3 pb-safe dark:border-gray-700">
            <button onClick={() => onManufacturers([])} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {t('filter_reset_all')}
            </button>
            <button onClick={() => setMobileSheet(false)} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900">
              {t('orders_apply') ?? 'Применить'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Desktop: full inline filters */}
    <div className="hidden md:flex items-center gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
      {/* Search */}
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('filter_search')}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
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
              ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-[#222222] dark:text-gray-100'
              : hasSelected
                ? 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-200'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
          )}
        >
          <span className="flex-1 truncate text-left">
            {hasSelected ? `${t('filter_manufacturer')} · ${selectedManufacturers.length}` : t('filter_manufacturer')}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute left-0 top-10 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#111111]">
            <div className="p-2 border-b border-gray-100 dark:border-[#333333]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={innerSearch}
                  onChange={(e) => setInnerSearch(e.target.value)}
                  placeholder={t('filter_search_inner')}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-700"
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
                        checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600'
                      )}>
                        {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                      </div>
                      <span className="truncate text-sm text-gray-700 dark:text-gray-300">{m}</span>
                    </label>
                  )
                })
              )}
            </div>

            {hasSelected && (
              <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
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
          <div className="absolute right-0 top-10 z-50 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('filter_columns_header')}</p>
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
                    checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600',
                  )}>
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
    </>
  )
}
