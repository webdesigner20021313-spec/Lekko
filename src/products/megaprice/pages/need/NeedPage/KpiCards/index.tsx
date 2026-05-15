import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { NeedItem, NeedStatus } from '@/products/megaprice/mocks/need.mocks'
import { InfoTooltip } from '../InfoTooltip'

interface Kpi {
  oos:        NeedItem[]
  critical:   NeedItem[]
  overstock:  NeedItem[]
  lostPerDay: number
  frozenTotal: number
  urgentTotal: number
  urgentCount: number
}

/** 4 кликабельные KPI-карточки, каждая — фильтр по набору статусов. */
export function KpiCards({
  kpi,
  periodDays,
  statusFilter,
  onKpiClick,
}: {
  kpi: Kpi
  periodDays: number
  statusFilter: NeedStatus[]
  onKpiClick: (statuses: NeedStatus[]) => void
}) {
  const { t } = useTranslation()

  function isActive(statuses: NeedStatus[]) {
    return statuses.length === statusFilter.length && statuses.every(s => statusFilter.includes(s))
  }

  function cardCls(active: boolean) {
    return cn(
      'flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all dark:bg-[#222222]',
      active ? 'border-gray-900 ring-1 ring-gray-900 dark:border-[#f1f1f1] dark:ring-[#f1f1f1]' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
    )
  }

  return (
    <div className="shrink-0 border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 dark:border-gray-700">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

        <div onClick={() => onKpiClick(['oos'])} className={cardCls(isActive(['oos']))}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_kpi_oos_title')}</p>
            <InfoTooltip text={t('need_kpi_oos_tooltip')} />
          </div>
          <div className="mt-auto flex items-end justify-between gap-1 pt-3">
            <p className={cn('text-2xl font-bold tabular-nums leading-none', kpi.oos.length > 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100')}>
              {kpi.oos.length === 1 ? t('need_kpi_count_1', { n: kpi.oos.length }) : t('need_kpi_count_many', { n: kpi.oos.length })}
            </p>
            <p className="text-xs text-gray-500 text-right leading-tight dark:text-gray-400">
              {kpi.oos.length > 0 ? t('need_kpi_oos_losses', { amount: formatCurrency(kpi.lostPerDay * periodDays), n: periodDays }) : t('need_kpi_oos_ok')}
            </p>
          </div>
        </div>

        <div onClick={() => onKpiClick(['critical'])} className={cardCls(isActive(['critical']))}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_kpi_critical_title')}</p>
            <InfoTooltip text={t('need_kpi_critical_tooltip')} />
          </div>
          <div className="mt-auto flex items-end justify-between gap-1 pt-3">
            <p className={cn('text-2xl font-bold tabular-nums leading-none', kpi.critical.length > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-gray-100')}>
              {kpi.critical.length === 1 ? t('need_kpi_count_1', { n: kpi.critical.length }) : t('need_kpi_count_many', { n: kpi.critical.length })}
            </p>
            <p className="text-xs text-gray-500 text-right leading-tight dark:text-gray-400">{t('need_kpi_critical_sub')}</p>
          </div>
        </div>

        <div onClick={() => onKpiClick(['oos', 'critical'])} className={cardCls(isActive(['oos', 'critical']))}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_kpi_urgent_title')}</p>
            <InfoTooltip text={t('need_kpi_urgent_tooltip')} />
          </div>
          <div className="mt-auto flex items-end justify-between gap-1 pt-3">
            <p className={cn('text-2xl font-bold tabular-nums leading-none', kpi.urgentTotal > 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100')}>
              {formatCurrency(kpi.urgentTotal)}
            </p>
            <p className="text-xs text-gray-500 text-right leading-tight dark:text-gray-400">
              {t('need_kpi_urgent_sub', { n: kpi.urgentCount })}
            </p>
          </div>
        </div>

        <div onClick={() => onKpiClick(['overstock', 'dead'])} className={cardCls(isActive(['overstock', 'dead']))}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_kpi_frozen_title')}</p>
            <InfoTooltip text={t('need_kpi_frozen_tooltip')} />
          </div>
          <div className="mt-auto flex items-end justify-between gap-1 pt-3">
            <p className="text-2xl font-bold tabular-nums leading-none text-blue-500">{formatCurrency(kpi.frozenTotal)}</p>
            <p className="text-xs text-gray-500 text-right leading-tight dark:text-gray-400">{t('need_kpi_frozen_sub', { n: kpi.overstock.length })}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
