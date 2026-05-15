import { Search, Building2, Calendar, ChevronDown, Check, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { GROUPS, PHARMACIES } from '../config'
import { fmtDate } from '../helpers'
import type { PeriodKey } from '../types'
import { RangeCalendar } from '../RangeCalendar'

interface PeriodOption { key: PeriodKey; label: string; days: number }

/** Desktop top-bar: pharmacy multi-select, search, group filter, period, export. */
export function FiltersBar({
  selectedPharmacyIds,
  setSelectedPharmacyIds,
  pharmacyOpen,
  setPharmacyOpen,
  pharmacyLabel,
  search,
  setSearch,
  groupFilter,
  setGroupFilter,
  groupOpen,
  setGroupOpen,
  period,
  setPeriod,
  periodOpen,
  setPeriodOpen,
  periods,
  customFrom,
  customTo,
  setCustomFrom,
  setCustomTo,
  onExport,
}: {
  selectedPharmacyIds: string[]
  setSelectedPharmacyIds: (next: string[] | ((p: string[]) => string[])) => void
  pharmacyOpen: boolean
  setPharmacyOpen: (v: boolean | ((p: boolean) => boolean)) => void
  pharmacyLabel: string
  search: string
  setSearch: (v: string) => void
  groupFilter: string | null
  setGroupFilter: (v: string | null) => void
  groupOpen: boolean
  setGroupOpen: (v: boolean | ((p: boolean) => boolean)) => void
  period: PeriodKey
  setPeriod: (k: PeriodKey) => void
  periodOpen: boolean
  setPeriodOpen: (v: boolean | ((p: boolean) => boolean)) => void
  periods: PeriodOption[]
  customFrom: string
  customTo: string
  setCustomFrom: (v: string) => void
  setCustomTo: (v: string) => void
  onExport: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="hidden md:block shrink-0 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-[#111111]">
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>

        {/* Pharmacy multi-select */}
        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => setPharmacyOpen(v => !v)}
            className={cn(
              'flex h-9 w-[240px] items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
              selectedPharmacyIds.length > 0
                ? 'border-gray-300 bg-gray-50 text-gray-900 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-100'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600',
            )}>
            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-left">{pharmacyLabel}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform', pharmacyOpen && 'rotate-180')} />
          </button>
          {pharmacyOpen && (
            <div className="absolute left-0 top-10 z-50 w-64 rounded-xl border border-gray-200 bg-white py-1 shadow-lg max-h-72 overflow-y-auto dark:border-gray-700 dark:bg-[#111111]">
              {PHARMACIES.map(ph => {
                const checked = selectedPharmacyIds.includes(ph.id)
                return (
                  <label key={ph.id}
                    onClick={() => setSelectedPharmacyIds(prev =>
                      checked ? prev.filter(id => id !== ph.id) : [...prev, ph.id]
                    )}
                    className="flex cursor-pointer w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors', checked ? 'border-blue-600 bg-blue-600 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600')}>
                      {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                    </div>
                    <span className={cn('truncate', checked ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300')}>{ph.name}</span>
                  </label>
                )
              })}
              {selectedPharmacyIds.length > 0 && (
                <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
                  <button onClick={() => setSelectedPharmacyIds([])} className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    {t('filter_reset_all')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative h-9 w-36 shrink-0 md:w-52">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={t('need_search_ph')} value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-full w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-400 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500" />
        </div>

        {/* Group filter */}
        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => setGroupOpen(v => !v)}
            className={cn(
              'flex h-9 w-[180px] items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
              groupFilter
                ? 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600',
            )}>
            <span className="flex-1 truncate text-left">{groupFilter ?? t('need_group_placeholder')}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', groupOpen && 'rotate-180')} />
          </button>
          {groupOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg max-h-64 overflow-y-auto dark:border-gray-700 dark:bg-[#111111]">
              <button onClick={() => { setGroupFilter(null); setGroupOpen(false) }}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800', !groupFilter ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-[#929292]')}>
                {t('need_group_all')}
              </button>
              {GROUPS.map(g => (
                <button key={g} onClick={() => { setGroupFilter(g); setGroupOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                  {groupFilter === g && <Check className="h-3.5 w-3.5 shrink-0 text-gray-900 dark:text-gray-100" />}
                  <span className={groupFilter === g ? '' : 'ml-5'}>{g}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Period dropdown */}
        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setPeriodOpen(v => !v)}
            className={cn(
              'flex h-9 w-[260px] items-center gap-2 rounded-lg border bg-white px-3 text-sm transition-colors dark:bg-[#111111]',
              periodOpen
                ? 'border-gray-400 ring-2 ring-gray-900/20 dark:border-gray-500'
                : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600',
            )}
          >
            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="whitespace-nowrap text-gray-500 dark:text-[#929292]">{t('need_period_for')}</span>
            <span className="flex-1 truncate text-left font-medium text-gray-900 dark:text-gray-100">
              {period === 'custom'
                ? (customFrom && customTo ? `${fmtDate(customFrom)} — ${fmtDate(customTo)}` : t('need_period_custom'))
                : periods.find(p => p.key === period)!.label}
            </span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', periodOpen && 'rotate-180')} />
          </button>

          {periodOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPeriodOpen(false)} />
              <div className="absolute left-0 top-10 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#111111]">
                <div className="py-1">
                  {periods.map(p => (
                    <button key={p.key}
                      onClick={() => { setPeriod(p.key); if (p.key !== 'custom') setPeriodOpen(false) }}
                      className={cn('flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800', period === p.key ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400')}>
                      <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors', period === p.key ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 dark:border-gray-600')}>
                        {period === p.key && <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-900" />}
                      </div>
                      <span className={period === p.key ? 'font-medium' : ''}>{p.label}</span>
                    </button>
                  ))}
                </div>
                {period === 'custom' && (
                  <div className="border-t border-gray-100 px-3 py-3 dark:border-[#333333]">
                    <RangeCalendar from={customFrom} to={customTo} onChange={(f, to) => { setCustomFrom(f); setCustomTo(to) }} />
                    <button
                      disabled={!customFrom || !customTo}
                      onClick={() => setPeriodOpen(false)}
                      className="mt-2 h-8 w-full rounded-lg bg-gray-900 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('need_period_apply')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Export */}
        <button onClick={onExport}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700 hover:border-green-700 transition-colors">
          <Download className="h-3.5 w-3.5" />
          Excel
        </button>
      </div>
    </div>
  )
}
