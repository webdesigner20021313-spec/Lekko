import { useRef, useState, useEffect } from 'react'
import { Search, ChevronDown, X, Check, AlignJustify } from 'lucide-react'
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

const bonusOptions: { value: BonusType; label: string }[] = [
  { value: 'cashback',      label: 'Кэшбэк'          },
  { value: 'gift',          label: '+Товар'           },
  { value: 'free_delivery', label: 'Беспл. доставка'  },
  { value: 'discount',      label: 'Скидка'           },
]

const columnOptions: { key: ColumnKey; label: string }[] = [
  { key: 'expiry',   label: 'Годен до'   },
  { key: 'payment',  label: 'Оплата'     },
  { key: 'price',    label: 'Цена с НДС' },
  { key: 'bonus',    label: 'Бонусы'     },
  { key: 'quantity', label: 'Количество' },
]

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
            ? 'border-gray-400 bg-white text-gray-900'
            : count > 0
              ? 'border-gray-300 bg-white text-gray-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
        )}
      >
        <span className="flex-1 truncate text-left">
          {count > 0 ? `${label} · ${count}` : label}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Поиск */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск..."
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white"
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
              <p className="px-3 py-3 text-xs text-gray-400">Ничего не найдено</p>
            ) : (
              filtered.map((item) => {
                const checked = selected.includes(item)
                return (
                  <label
                    key={item}
                    onClick={() => onToggleItem(item)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50"
                  >
                    <div className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                    )}>
                      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm text-gray-700">{item}</span>
                  </label>
                )
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600">
                Сбросить всё
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
  const [openDist, setOpenDist]   = useState(false)
  const [openCity, setOpenCity]   = useState(false)
  const [openBonus, setOpenBonus] = useState(false)
  const [openCols, setOpenCols]   = useState(false)

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

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">

      {/* Distributor — с поиском */}
      <div ref={distRef} className="relative">
        <SearchableDropdown
          open={openDist}
          onToggle={() => setOpenDist((v) => !v)}
          label="Дистрибутор"
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
          label="Город"
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
              ? 'border-gray-400 bg-white text-gray-900'
              : bonusFilter.length
                ? 'border-gray-300 bg-white text-gray-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
          )}
        >
          <span className="flex-1 truncate text-left">
            {bonusFilter.length ? `Бонусы · ${bonusFilter.length}` : 'Бонусы'}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', openBonus && 'rotate-180')} />
        </button>

        {openBonus && (
          <div className="absolute left-0 top-10 z-50 w-[200px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Бонусы
            </p>
            <div className="overflow-y-auto">
              {bonusOptions.map((b) => {
                const checked = bonusFilter.includes(b.value)
                return (
                  <label
                    key={b.value}
                    onClick={() => toggleBonus(b.value)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50"
                  >
                    <div className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                    )}>
                      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm text-gray-700">{b.label}</span>
                  </label>
                )
              })}
            </div>
            {bonusFilter.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button onClick={() => onBonus([])} className="text-xs text-gray-400 hover:text-gray-600">
                  Сбросить всё
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
          className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-600"
        >
          <X className="h-3.5 w-3.5" />
          Очистить
        </button>
      )}

      {/* Column toggle */}
      {showColumnToggle && <div ref={colsRef} className="relative ml-auto">
        <button
          onClick={() => setOpenCols((v) => !v)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            openCols
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          )}
        >
          <AlignJustify className="h-4 w-4" />
        </button>

        {openCols && (
          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Столбцы
            </p>
            {columnOptions.map((col) => {
              const checked = visibleColumns[col.key]
              return (
                <label
                  key={col.key}
                  onClick={() => onToggleColumn(col.key)}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50"
                >
                  <div className={cn(
                    'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                    checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                  )}>
                    {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-700">{col.label}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>}
    </div>
  )
}
