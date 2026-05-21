import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { BottomSheet } from '@/shared/ui-kit/BottomSheet'
import { GROUPS, PHARMACIES } from '../config'
import type { PeriodKey } from '../types'

interface PeriodOption { key: PeriodKey; label: string; days: number }

/** Mobile bottom-sheet с фильтрами (pharmacy / group / period). */
export function MobileFiltersSheet({
  open,
  onClose,
  selectedPharmacyIds,
  setSelectedPharmacyIds,
  groupFilter,
  setGroupFilter,
  period,
  setPeriod,
  periods,
  setSearch,
}: {
  open: boolean
  onClose: () => void
  selectedPharmacyIds: string[]
  setSelectedPharmacyIds: (v: string[] | ((p: string[]) => string[])) => void
  groupFilter: string | null
  setGroupFilter: (v: string | null) => void
  period: PeriodKey
  setPeriod: (k: PeriodKey) => void
  periods: PeriodOption[]
  setSearch: (v: string) => void
}) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('need_filters_title')}
      footer={
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedPharmacyIds([])
              setGroupFilter(null)
              setPeriod('30d')
              setSearch('')
            }}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            {t('filter_reset_all')}
          </button>
          <button
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900"
          >
            {t('need_period_apply')}
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5">
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('filter_pharmacy')}</p>
          <div className="space-y-1.5">
            {PHARMACIES.map(ph => {
              const checked = selectedPharmacyIds.includes(ph.id)
              return (
                <label
                  key={ph.id}
                  onClick={() => setSelectedPharmacyIds(prev => checked ? prev.filter(id => id !== ph.id) : [...prev, ph.id])}
                  className={cn('flex h-12 items-center gap-3 rounded-xl border px-3.5',
                    checked ? 'border-gray-900 bg-gray-50 dark:border-[#f1f1f1] dark:bg-[#222222]' : 'border-gray-200 dark:border-gray-700')}
                >
                  <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2', checked ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1]' : 'border-gray-300 dark:border-gray-600')}>
                    {checked && <Check className="h-3.5 w-3.5 text-white dark:text-gray-900" strokeWidth={3} />}
                  </div>
                  <span className={cn('truncate text-sm', checked ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300')}>{ph.name}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_th_group')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGroupFilter(null)}
              className={cn('h-10 rounded-full px-3.5 text-xs font-semibold',
                !groupFilter ? 'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900' : 'border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300')}
            >
              {t('need_group_all')}
            </button>
            {GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={cn('h-10 rounded-full px-3.5 text-xs font-semibold',
                  groupFilter === g ? 'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900' : 'border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300')}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_period_for')}</p>
          <div className="grid grid-cols-2 gap-2">
            {periods.filter(p => p.key !== 'custom').map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn('h-11 rounded-xl border text-sm font-medium',
                  period === p.key ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
