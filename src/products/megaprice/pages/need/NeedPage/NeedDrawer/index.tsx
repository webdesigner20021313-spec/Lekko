import { useState, useEffect, useMemo } from 'react'
import { X, Plus, TrendingDown, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { NeedItem } from '@/products/megaprice/mocks/need.mocks'
import type { SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { OFFER_COUNT, STATUS_STYLE } from '../config'
import { calcRecommendedQty, getAllOffers, getItemPharmacies } from '../helpers'
import { MiniBarChart } from '../MiniBarChart'

export function NeedDrawer({ item, periodDays, selectedPharmacyIds, activeOffer, onClose, onAddToCart, onShowOffers }: {
  item: NeedItem
  periodDays: number
  selectedPharmacyIds: string[]
  activeOffer: SupplierOffer | null
  onClose: () => void
  onAddToCart: (item: NeedItem, qty: number) => void
  onShowOffers: (item: NeedItem) => void
}) {
  const { t } = useTranslation()
  const cfg        = STATUS_STYLE[item.status]
  const recQty     = calcRecommendedQty(item, periodDays)
  const [qty, setQty] = useState(recQty > 0 ? recQty : 1)

  const bestOffer = activeOffer
  const pharmacies = useMemo(() => {
    const all = getItemPharmacies(item)
    return selectedPharmacyIds.length > 0
      ? all.filter(ph => selectedPharmacyIds.includes(ph.id))
      : all
  }, [item, selectedPharmacyIds])

  useEffect(() => {
    const q = calcRecommendedQty(item, periodDays)
    setQty(q > 0 ? q : 1)
    // Намеренно зависим только от item.id (не от ссылки item) — пересчёт qty
    // лишь при смене препарата или периода.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, periodDays])

  const oosDays   = item.oosSince
    ? Math.floor((new Date('2026-04-28').getTime() - new Date(item.oosSince).getTime()) / 86400000)
    : 0
  const totalLost = oosDays * item.lostRevenuePerDay
  const orderCost = qty * (bestOffer?.priceWithVat ?? item.costPrice)
  const excessQty = Math.max(0, item.stock - item.optimalStock)

  const metrics = [
    { label: t('need_metric_stock'),       value: item.stock === 0 ? t('need_metric_no_stock') : t('need_pcs_n', { n: item.stock }),           color: item.stock === 0 ? '#EF4444' : undefined },
    { label: t('need_metric_sales_day'),   value: t('need_pcs_n', { n: item.avgDailySales.toFixed(1) }) },
    { label: t('need_metric_cover'),       value: item.daysOfCover === 0 ? t('need_metric_zero_days') : t('need_days_n', { n: Math.round(item.daysOfCover) }), color: item.daysOfCover === 0 ? '#EF4444' : undefined },
    { label: t('need_metric_price_sale'),  value: formatCurrency(item.salePrice) },
    { label: t('need_metric_price_cost'),  value: formatCurrency(item.costPrice) },
    { label: t('need_metric_sales_month'), value: t('need_pcs_n', { n: item.sales30d }) },
  ]

  return (
    <div className="fixed inset-0 z-50 flex h-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl md:relative md:inset-auto md:w-[580px] md:min-w-[580px] md:shrink-0 dark:border-gray-700 dark:bg-[#111111]">

      <div className="shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">{item.name}</p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-[#929292]">{item.manufacturer} · {item.country} · {item.group}</p>
          </div>
          <button onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg.badgeCls)}>
            {t(`need_status_${item.status}`)}
          </span>
          {item.status === 'oos' && oosDays > 0 && (
            <span className="text-xs text-red-500 dark:text-red-400">{t('need_oos_since', { n: oosDays })}</span>
          )}
          {item.status === 'critical' && (
            <span className="text-xs text-amber-600 dark:text-amber-400">{t('need_critical_cover', { n: Math.round(item.daysOfCover) })}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        <div className="mx-4 mt-6 grid grid-cols-3 gap-2">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-[#333333] dark:bg-[#222222]">
              <p className="text-xs font-normal text-gray-400 dark:text-[#929292]">{label}</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100" style={color ? { color } : undefined}>{value}</p>
            </div>
          ))}
        </div>

        {item.status === 'oos' && item.lostRevenuePerDay > 0 && (
          <div className="mx-4 mt-4 rounded-xl bg-gray-900 p-4 dark:bg-[#222222]">
            <div className="mb-6 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white">{t('need_loss_title')}</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] text-white">{t('need_loss_per_day')}</p>
                <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-red-400">{formatCurrency(item.lostRevenuePerDay)}</p>
              </div>
              {oosDays > 0 && (
                <div className="text-right">
                  <p className="text-[11px] text-white">{t('need_loss_already', { n: oosDays })}</p>
                  <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-red-400">{formatCurrency(totalLost)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(item.status === 'overstock' || item.status === 'dead') && item.frozenAmount > 0 && (
          <div className="mx-4 mt-4 rounded-xl bg-gray-900 p-4 dark:bg-[#222222]">
            <div className="mb-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white">{t('need_frozen_title')}</span>
              </div>
              <span className="text-[12px] text-gray-300">{t('need_frozen_sub', { stock: item.stock, excess: excessQty })}</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] text-white">{t('need_frozen_in_stock')}</p>
                <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-white">{formatCurrency(item.frozenAmount)}</p>
              </div>
              {item.avgDailySales > 0 && (
                <div className="text-right">
                  <p className="text-[11px] text-white">{t('need_will_sell_in')}</p>
                  <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-white">{t('need_approx_days', { n: Math.round(item.stock / item.avgDailySales) })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mx-4 mt-6">
          <p className="mb-3 text-xs font-semibold text-gray-900 dark:text-gray-100">{t('need_chart_title')}</p>
          <MiniBarChart data={item.monthlySales} />
        </div>

        <div className="mx-4 mt-6 mb-6">
          <p className="mb-2 text-xs font-semibold text-gray-900 dark:text-gray-100">{t('need_ph_title')}</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#222222]">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_ph_col_pharmacy')}</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_col_stock')}</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_ph_col_sales_month')}</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((ph, idx) => {
                  const phStyle = STATUS_STYLE[ph.status]
                  return (
                    <tr key={ph.id}
                      className={cn('border-b border-gray-100 last:border-0 dark:border-[#333333]', idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-[#222222]/50' : 'bg-white dark:bg-[#111111]')}>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-300" style={{ maxWidth: 130 }}>{ph.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <span className={cn('text-xs font-semibold', ph.stock === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300')}>
                          {ph.stock === 0 ? '—' : ph.stock}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{ph.sales30d}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap', phStyle.badgeCls)}>
                          {t(`need_status_${ph.status}`)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]" style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' }}>
        {recQty > 0 ? (
          <>
            {bestOffer && (
              <div className="mb-2 flex items-center gap-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors text-sm font-bold dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500">−</button>
                <input type="number" min={1} value={qty}
                  onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                  className="h-8 w-16 rounded-lg border border-gray-200 bg-white text-center text-sm font-semibold tabular-nums outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-100 dark:focus:border-gray-400" />
                <button onClick={() => setQty(q => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors text-sm font-bold dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500">+</button>
                <span className="ml-auto text-[18px] font-bold text-gray-900 dark:text-gray-100">{formatCurrency(orderCost)}</span>
              </div>
            )}
            {bestOffer && (() => {
              const cheapestPrice = getAllOffers(item.id)[0]?.priceWithVat ?? 0
              const isActuallyBest = bestOffer.priceWithVat === cheapestPrice
              return (
                <button
                  onClick={() => onShowOffers(item)}
                  className="mb-3 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50 transition-colors dark:text-gray-400 dark:hover:bg-gray-800">
                  <span className="shrink-0">{isActuallyBest ? t('need_best_price_label') : t('need_selected_dist_label')}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{bestOffer.distributor.name}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span className="text-gray-500 dark:text-[#929292]">{bestOffer.distributor.city}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span className="font-semibold text-gray-700 tabular-nums dark:text-gray-300">{formatCurrency(bestOffer.priceWithVat)}/шт.</span>
                  {OFFER_COUNT[item.id] > 1 && (
                    <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-[#222222] dark:text-gray-400">
                      {t('need_more_offers', { n: OFFER_COUNT[item.id] - 1 })}
                    </span>
                  )}
                </button>
              )
            })()}
            <button onClick={() => bestOffer && onAddToCart(item, qty)}
              disabled={!bestOffer}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
                bestOffer
                  ? 'bg-gray-900 text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-[#222222] dark:text-[#929292]',
              )}>
              <Plus className="h-4 w-4" />
              {t('need_add_to_cart_btn')}
            </button>
            {!bestOffer && (
              <p className="mt-2 text-center text-xs text-red-500 dark:text-red-400">{t('need_no_offers_warning')}</p>
            )}
          </>
        ) : (
          <p className="py-1 text-center text-xs text-gray-400 dark:text-[#929292]">{t('need_no_order')}</p>
        )}
      </div>
    </div>
  )
}
