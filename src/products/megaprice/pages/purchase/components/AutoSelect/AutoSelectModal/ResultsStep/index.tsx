import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { LocalResult } from '../types'

/** Шаг 3 — карточки итогов: сводка + 3 секции (matched/no_offers/filtered_out). */
export function ResultsStep({
  totalCount,
  matched,
  noOffers,
  filtered,
}: {
  totalCount: number
  matched: LocalResult[]
  noOffers: LocalResult[]
  filtered: LocalResult[]
}) {
  const { t } = useTranslation()

  return (
    <div className="p-5">

      {/* Сводка */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center dark:border-gray-700 dark:bg-[#222222]">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">{t('autoselect_stat_total')}</p>
        </div>
        <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3 text-center">
          <p className="text-2xl font-bold text-[#065F46]">{matched.length}</p>
          <p className="mt-0.5 text-xs text-[#065F46]/80">{t('autoselect_stat_matched')}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-700 dark:bg-[#222222]">
          <p className={cn(
            'text-2xl font-bold',
            (noOffers.length + filtered.length) > 0 ? 'text-gray-700' : 'text-gray-300',
          )}>
            {noOffers.length + filtered.length}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{t('autoselect_stat_excluded')}</p>
        </div>
      </div>

      {/* Подобранные */}
      {matched.length > 0 && (
        <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
            <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('autoselect_section_matched', { count: matched.length })}</p>
          </div>
          <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto bg-white dark:divide-[#333333] dark:bg-[#111111]">
            {matched.map(r => (
              <div key={r.medicine.id} className="flex h-[52px] items-center gap-3 px-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{r.medicine.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">
                    {r.offer!.distributor.name} · {r.offer!.distributor.city}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(r.offer!.priceWithVat)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {matched.length === 0 && (
        <div className="mb-3 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-[#222222]">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('autoselect_no_results')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('autoselect_no_results_hint')}</p>
        </div>
      )}

      {/* Нет предложений */}
      {noOffers.length > 0 && (
        <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('autoselect_section_no_offers', { count: noOffers.length })}</p>
          </div>
          <div className="max-h-28 divide-y divide-gray-100 overflow-y-auto bg-white dark:divide-[#333333] dark:bg-[#111111]">
            {noOffers.map(r => (
              <p key={r.medicine.id} className="flex h-9 items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                {r.medicine.name}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Исключено */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('autoselect_section_excluded', { count: filtered.length })}</p>
          </div>
          <div className="max-h-28 divide-y divide-gray-100 overflow-y-auto bg-white dark:divide-[#333333] dark:bg-[#111111]">
            {filtered.map(r => (
              <p key={r.medicine.id} className="flex h-9 items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                {r.medicine.name}
              </p>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
