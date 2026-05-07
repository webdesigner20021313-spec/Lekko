import { useRef, useState, useEffect } from 'react'
import { Search, ChevronDown, X, Check, AlignJustify, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { BonusType, ColumnKey } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface SupplierFiltersProps {
  distributorFilter: string[]
  onDistributor: (values: string[]) => void
  cityFilter: string[]
  onCity: (values: string[]) => void
  bonusFilter: BonusType[]
  onBonus: (values: BonusType[]) => void
  distributors: string[]
  cities: string[]
  visibleColumns: Record<ColumnKey, boolean>
  onToggleColumn: (key: ColumnKey) => void
}

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return ref
}

/** Дропдаун с поиском внутри */
function SearchableDropdown({
  open, onToggle, label, count,
  items, selected, onToggleItem, onClear,
}: {
  open: boolean
  onToggle: () => void
  label: string
  count: number
  items: string[]
  selected: string[]
  onToggleItem: (v: string) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = items.filter((i) => i.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'flex h-9 w-[200px] items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
          open
            ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-[#222222] dark:text-gray-100'
            : count > 0
              ? 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-200'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
        )}
      >
        <span className="flex-1 truncate text-left">
          {count > 0 ? `${label} · ${count}` : label}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#111111]">
          {/* Поиск */}
          <div className="p-2 border-b border-gray-100 dark:border-[#333333]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('filter_search_inner')}
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-700"
              />
              {q && (
                <button
                  onClick={(e) => { e.stopPropagation(); setQ('') }}
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
              filtered.map((item) => {
                const checked = selected.includes(item)
                return (
                  <label
                    key={item}
                    onClick={() => onToggleItem(item)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </label>
                )
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
              <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                {t('filter_reset_all')}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function SupplierFilters({
  distributorFilter, onDistributor,
  cityFilter, onCity,
  bonusFilter, onBonus,
  distributors, cities,
  visibleColumns, onToggleColumn,
  showColumnToggle = true,
}: SupplierFiltersProps & { showColumnToggle?: boolean }) {
  const { t } = useTranslation()

  const bonusOptions: { value: BonusType; label: string }[] = [
    { value: 'cashback',      label: t('bonus_cashback')      },
    { value: 'gift',          label: t('bonus_gift')          },
    { value: 'free_delivery', label: t('bonus_free_delivery') },
    { value: 'discount',      label: t('bonus_discount')      },
  ]

  const columnOptions: { key: ColumnKey; label: string }[] = [
    { key: 'expiry',   label: t('col_expiry')    },
    { key: 'payment',  label: t('col_payment')   },
    { key: 'price',    label: t('col_price_vat') },
    { key: 'bonus',    label: t('filter_bonuses') },
    { key: 'quantity', label: t('col_quantity')  },
  ]

  const [openDist, setOpenDist]   = useState(false)
  const [openCity, setOpenCity]   = useState(false)
  const [openBonus, setOpenBonus] = useState(false)
  const [openCols, setOpenCols]   = useState(false)
  const [mobileSheet, setMobileSheet] = useState(false)

  const distRef  = useClickOutside(() => setOpenDist(false))
  const cityRef  = useClickOutside(() => setOpenCity(false))
  const bonusRef = useClickOutside(() => setOpenBonus(false))
  const colsRef  = useClickOutside(() => setOpenCols(false))

  const hasAnyFilter = distributorFilter.length > 0 || cityFilter.length > 0 || bonusFilter.length > 0

  function clearAllFilters() {
    onDistributor([])
    onCity([])
    onBonus([])
  }

  function toggleDist(v: string) {
    onDistributor(distributorFilter.includes(v)
      ? distributorFilter.filter((x) => x !== v)
      : [...distributorFilter, v])
  }
  function toggleCity(v: string) {
    onCity(cityFilter.includes(v)
      ? cityFilter.filter((x) => x !== v)
      : [...cityFilter, v])
  }
  function toggleBonus(v: BonusType) {
    onBonus(bonusFilter.includes(v)
      ? bonusFilter.filter((x) => x !== v)
      : [...bonusFilter, v])
  }

  const totalActive = distributorFilter.length + cityFilter.length + bonusFilter.length

  return (
    <>
    {/* Mobile single filter button */}
    <div className="md:hidden flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
      <button
        onClick={() => setMobileSheet(true)}
        className={cn(
          'relative flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold',
          totalActive
            ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
            : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300',
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t('filter_distributor')} · {t('filter_city')} · {t('filter_bonuses')}
        {totalActive > 0 && (
          <span className="ml-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-gray-900">{totalActive}</span>
        )}
      </button>
      {hasAnyFilter && (
        <button
          onClick={clearAllFilters}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
          aria-label={t('filter_clear')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>

    {mobileSheet && (
      <div className="fixed inset-0 z-50 md:hidden">
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setMobileSheet(false)} />
        <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-[#111111]">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('orders_filters') ?? 'Фильтры'}</h2>
            <button onClick={() => setMobileSheet(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('filter_distributor')}</p>
              <div className="space-y-1.5">
                {distributors.map(d => {
                  const checked = distributorFilter.includes(d)
                  return (
                    <label key={d} onClick={() => toggleDist(d)} className={cn('flex h-11 items-center gap-3 rounded-xl border px-3.5',
                      checked ? 'border-gray-900 bg-gray-50 dark:border-[#f1f1f1] dark:bg-[#222222]' : 'border-gray-200 dark:border-gray-700')}>
                      <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2', checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1]' : 'border-gray-300 dark:border-gray-600')}>
                        {checked && <Check className="h-3.5 w-3.5 text-white dark:text-gray-900" strokeWidth={3} />}
                      </div>
                      <span className={cn('truncate text-sm', checked ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300')}>{d}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('filter_city')}</p>
              <div className="flex flex-wrap gap-2">
                {cities.map(c => {
                  const checked = cityFilter.includes(c)
                  return (
                    <button key={c} onClick={() => toggleCity(c)}
                      className={cn('h-10 rounded-full px-3.5 text-xs font-semibold',
                        checked ? 'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900' : 'border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300')}>
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('filter_bonuses')}</p>
              <div className="grid grid-cols-2 gap-2">
                {bonusOptions.map(b => {
                  const checked = bonusFilter.includes(b.value)
                  return (
                    <button key={b.value} onClick={() => toggleBonus(b.value)}
                      className={cn('flex h-11 items-center justify-center rounded-xl border px-3 text-xs font-medium',
                        checked ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300')}>
                      {b.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 border-t border-gray-100 px-5 py-3 pb-safe dark:border-gray-700">
            <button onClick={clearAllFilters} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {t('filter_reset_all')}
            </button>
            <button onClick={() => setMobileSheet(false)} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900">
              {t('orders_apply') ?? 'Применить'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Desktop inline filters */}
    <div className="hidden md:flex items-center gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]" style={{ scrollbarWidth: 'none' }}>

      {/* Distributor — с поиском */}
      <div ref={distRef} className="relative">
        <SearchableDropdown
          open={openDist}
          onToggle={() => setOpenDist((v) => !v)}
          label={t('filter_distributor')}
          count={distributorFilter.length}
          items={distributors}
          selected={distributorFilter}
          onToggleItem={toggleDist}
          onClear={() => onDistributor([])}
        />
      </div>

      {/* City — с поиском */}
      <div ref={cityRef} className="relative">
        <SearchableDropdown
          open={openCity}
          onToggle={() => setOpenCity((v) => !v)}
          label={t('filter_city')}
          count={cityFilter.length}
          items={cities}
          selected={cityFilter}
          onToggleItem={toggleCity}
          onClear={() => onCity([])}
        />
      </div>

      {/* Bonus — без поиска (4 варианта) */}
      <div ref={bonusRef} className="relative">
        <button
          onClick={() => setOpenBonus((v) => !v)}
          className={cn(
            'flex h-9 w-[200px] items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
            openBonus
              ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-[#222222] dark:text-gray-100'
              : bonusFilter.length
                ? 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-200'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
          )}
        >
          <span className="flex-1 truncate text-left">
            {bonusFilter.length ? `${t('filter_bonuses')} · ${bonusFilter.length}` : t('filter_bonuses')}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', openBonus && 'rotate-180')} />
        </button>

        {openBonus && (
          <div className="absolute left-0 top-10 z-50 w-[200px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">
              {t('filter_bonuses')}
            </p>
            <div className="overflow-y-auto">
              {bonusOptions.map((b) => {
                const checked = bonusFilter.includes(b.value)
                return (
                  <label
                    key={b.value}
                    onClick={() => toggleBonus(b.value)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">{b.label}</span>
                  </label>
                )
              })}
            </div>
            {bonusFilter.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
                <button onClick={() => onBonus([])} className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                  {t('filter_reset_all')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Кнопка «Очистить» — появляется когда активен хоть один фильтр */}
      {hasAnyFilter && (
        <button
          onClick={clearAllFilters}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:border-red-800/60 dark:hover:bg-red-900/30 dark:hover:text-red-300"
        >
          <X className="h-3.5 w-3.5" />
          {t('filter_clear')}
        </button>
      )}

      {/* Column toggle */}
      {showColumnToggle && <div ref={colsRef} className="relative ml-auto hidden md:block">
        <button
          onClick={() => setOpenCols((v) => !v)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            openCols
              ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-400 dark:bg-gray-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
          )}
        >
          <AlignJustify className="h-4 w-4" />
        </button>

        {openCols && (
          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">
              {t('filter_columns_header')}
            </p>
            {columnOptions.map((col) => {
              const checked = visibleColumns[col.key]
              return (
                <label
                  key={col.key}
                  onClick={() => onToggleColumn(col.key)}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className={cn(
                    'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                    checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600'
                  )}>
                    {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>}
    </div>
    </>
  )
}
