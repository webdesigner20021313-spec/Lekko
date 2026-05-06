import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { mockDistributors } from '@/products/megaprice/mocks/purchase.mocks'
import { formatDate } from '@/shared/utils/format'
import { cn } from '@/shared/utils/utils'
import type { Distributor } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface WholesalersViewProps {
  selectedId: string | null
  onSelect: (distributor: Distributor) => void
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

export function WholesalersView({ selectedId, onSelect }: WholesalersViewProps) {
  const { t } = useTranslation()
  const [search,     setSearch]     = useState('')
  const [cityFilter, setCityFilter] = useState<string[]>([])
  const [openCity,   setOpenCity]   = useState(false)

  const cityRef = useClickOutside(() => setOpenCity(false))

  const allCities = useMemo(
    () => Array.from(new Set(mockDistributors.map((d) => d.city))).sort(),
    []
  )

  const filtered = useMemo(() => {
    let list = mockDistributors
    if (cityFilter.length) list = list.filter((d) => cityFilter.includes(d.city))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q))
    }
    return list
  }, [cityFilter, search])

  function toggleCity(city: string) {
    setCityFilter((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Фильтры */}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">

        {/* Поиск */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filter_search_inner')}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
          />
        </div>

        {/* Город */}
        <div ref={cityRef} className="relative flex-1">
          <button
            onClick={() => setOpenCity((v) => !v)}
            className={cn(
              'flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors',
              openCity
                ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100'
                : cityFilter.length
                  ? 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
            )}
          >
            <span className="truncate">{cityFilter.length ? `${t('filter_city')} · ${cityFilter.length}` : t('filter_city')}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', openCity && 'rotate-180')} />
          </button>

          {openCity && (
            <div className="absolute left-0 top-10 z-50 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              {allCities.map((city) => {
                const checked = cityFilter.includes(city)
                return (
                  <label
                    key={city}
                    onClick={() => toggleCity(city)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-gray-900 bg-gray-900 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">{city}</span>
                  </label>
                )
              })}
              {cityFilter.length > 0 && (
                <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
                  <button onClick={() => setCityFilter([])} className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                    {t('filter_reset')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {cityFilter.length > 0 && (
          <button
            onClick={() => setCityFilter([])}
            className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Таблица */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
          <colgroup>
            <col style={{ width: 48 }} />
            <col />
            <col style={{ width: 130 }} />
          </colgroup>
          <thead>
            <tr style={{ height: 48, background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)', position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ padding: '0 16px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}
                className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                №
              </th>
              <th style={{ padding: '0 16px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}
                className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('col_distributor')}
              </th>
              <th style={{ padding: '0 16px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden' }}
                className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('col_price_date')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-16 text-center text-sm text-gray-400">
                  {t('filter_nothing_found')}
                </td>
              </tr>
            ) : (
              filtered.map((dist, i) => {
                const isSelected = dist.id === selectedId
                return (
                  <tr
                    key={dist.id}
                    onClick={() => onSelect(dist)}
                    className={cn(
                      'cursor-pointer border-b border-gray-100 transition-colors dark:border-[#333333]',
                      isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    <td className={cn(
                      'px-4 py-3 text-center text-xs text-gray-400',
                      isSelected && 'border-l-2 border-l-gray-900 dark:border-l-blue-400'
                    )}>
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className={cn('text-sm text-gray-900 dark:text-gray-100', isSelected ? 'font-semibold' : 'font-medium')}>
                        {dist.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dist.city}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(dist.lastPriceDate)}</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
