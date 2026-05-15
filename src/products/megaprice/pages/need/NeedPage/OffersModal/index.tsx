import { X, Package, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { NeedItem } from '@/products/megaprice/mocks/need.mocks'
import type { SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { getAllOffers } from '../helpers'

export function OffersModal({ item, currentOfferId, onSelectOffer, onClose }: {
  item: NeedItem
  currentOfferId: string | null
  onSelectOffer: (offer: SupplierOffer) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const offers    = getAllOffers(item.id)
  const bestPrice = offers[0]?.priceWithVat ?? 0

  const colHeaders = [
    t('col_distributor'), t('need_col_city'), t('col_price_vat'),
    t('col_price_date'), t('need_col_expiry_date'), t('need_col_bonus'),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center"
      onClick={onClose}>
      <div className="flex h-full max-h-[100vh] w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[80vh] md:w-[760px] md:rounded-xl dark:bg-[#111111] dark:md:border dark:md:border-gray-700"
        onClick={e => e.stopPropagation()}>

        <div className="shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-[#929292]">{item.manufacturer} · {item.country} · {item.group}</p>
            </div>
            <button onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors dark:hover:bg-gray-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-[#929292]">{t('need_offers_empty')}</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#222222]" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <th className="w-8 px-3 py-2.5" />
                  {colHeaders.map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => {
                  const isBest     = offer.priceWithVat === bestPrice
                  const isSelected = (currentOfferId ?? offers[0]?.id) === offer.id
                  return (
                    <tr key={offer.id}
                      onClick={() => { onSelectOffer(offer); onClose() }}
                      className={cn(
                        'cursor-pointer border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 dark:border-[#333333] dark:hover:bg-gray-800',
                        isBest && !isSelected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-[#111111]',
                      )}>
                      <td className="px-3 py-3">
                        <div className={cn('h-4 w-4 rounded-full border-2 flex items-center justify-center',
                          isSelected ? 'border-gray-900 dark:border-gray-200' : 'border-gray-300 dark:border-gray-600')}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-200" />}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{offer.distributor.name}</span>
                          {isBest && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <Star className="h-2.5 w-2.5" />
                              {t('need_offers_best')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{offer.distributor.city}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className={cn('text-xs font-bold tabular-nums', isBest ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-100')}>
                            {formatCurrency(offer.priceWithVat)}
                          </span>
                          {offer.originalPrice && (
                            <span className="text-[10px] text-gray-400 tabular-nums line-through dark:text-gray-600">
                              {formatCurrency(offer.originalPrice)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500 dark:text-[#929292]">{offer.distributor.lastPriceDate}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500 dark:text-[#929292]">{offer.expiryDate}</span>
                      </td>
                      <td className="px-3 py-3">
                        {offer.bonus
                          ? <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">{offer.bonus.label}</span>
                          : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
