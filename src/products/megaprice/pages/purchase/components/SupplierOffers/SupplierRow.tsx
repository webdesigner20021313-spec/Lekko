import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { QuantityControl } from './QuantityControl'
import { useWholesalersStore } from '@/products/megaprice/stores/useWholesalersStore'
import type { SupplierOffer, BonusType, PaymentOption, ColumnKey } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { Col2Widths, ReorderColKey } from './SupplierTable'

const ROW_H = 56

interface SupplierRowProps {
  offer: SupplierOffer
  index: number
  cols: Col2Widths
  avgPrice: number
  quantity: number
  onQuantityChange: (offerId: string, quantity: number) => void
  visibleColumns: Record<ColumnKey, boolean>
  colOrder: ReorderColKey[]
}

const bonusStyles: Record<BonusType, string> = {
  cashback:      'bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]',
  gift:          'bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]',
  free_delivery: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD]',
  discount:      'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]',
}

const tdBase: React.CSSProperties = {
  padding: 0, overflow: 'hidden', borderBottom: '1px solid var(--table-cell-border)',
}
const cellDiv = (extra?: React.CSSProperties): React.CSSProperties => ({
  height: ROW_H, display: 'flex', flexDirection: 'column', justifyContent: 'center',
  overflow: 'hidden', padding: '0 16px', whiteSpace: 'nowrap', ...extra,
})

export function SupplierRow({ offer, index, avgPrice, quantity, onQuantityChange, visibleColumns, colOrder }: SupplierRowProps) {
  const { t } = useTranslation()
  const col = visibleColumns
  const myDiscount   = useWholesalersStore(s => s.getDiscount(offer.distributor.name))
  const effectivePrice = myDiscount ? Math.round(offer.priceWithVat * (1 - myDiscount / 100)) : offer.priceWithVat

  function getExpiryLabel(expiryDate: string): { text: string; urgent: boolean } | null {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    if (diffDays < 0)     return { text: t('expiry_overdue'),                   urgent: true }
    if (diffDays < 30)    return { text: t('expiry_lt_1m'),                      urgent: true }
    if (diffMonths === 1) return { text: t('expiry_1m'),                         urgent: true }
    if (diffMonths < 6)   return { text: t('expiry_n_months', { n: diffMonths }), urgent: true }
    return null
  }

  function getPriceCompare(price: number, avg: number): { text: string; positive: boolean } | null {
    if (!avg || avg === price) return null
    const diff = Math.round(Math.abs((price - avg) / avg) * 100)
    if (diff < 3) return null
    return price < avg
      ? { text: t('price_lower', { diff }), positive: true }
      : { text: t('price_higher', { diff }), positive: false }
  }

  function formatPayment(p: PaymentOption): string {
    return p.percentage === null ? t('payment_negotiable') : `${p.percentage}%`
  }

  const expiryLabel  = getExpiryLabel(offer.expiryDate)
  const priceCompare = getPriceCompare(effectivePrice, avgPrice)
  const discountPct  = myDiscount
    ? myDiscount
    : offer.originalPrice
      ? Math.round((1 - offer.priceWithVat / offer.originalPrice) * 100)
      : null

  function renderCell(key: ReorderColKey) {
    switch (key) {
      case 'distributor':
        return (
          <td key="distributor" style={tdBase}>
            <div style={cellDiv()}>
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{offer.distributor.name}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{offer.distributor.city}</p>
            </div>
          </td>
        )
      case 'expiry':
        return !col.expiry ? null : (
          <td key="expiry" style={tdBase}>
            <div style={cellDiv()}>
              <p className={cn('text-sm', expiryLabel ? 'text-red-600 font-medium dark:text-red-400' : 'text-gray-700 dark:text-gray-300')}>
                {formatDate(offer.expiryDate)}
              </p>
              {expiryLabel && <p className="text-xs text-red-500">{expiryLabel.text}</p>}
            </div>
          </td>
        )
      case 'payment':
        return !col.payment ? null : (
          <td key="payment" style={tdBase}>
            <div style={cellDiv()}>
              <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                {offer.paymentTypes.map(formatPayment).join(' \\ ')}
              </p>
            </div>
          </td>
        )
      case 'price':
        return !col.price ? null : (
          <td key="price" style={tdBase}>
            <div style={cellDiv({ alignItems: 'flex-end' })}>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(effectivePrice)}</span>
              {discountPct && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 line-through">
                    {formatCurrency(myDiscount ? offer.priceWithVat : offer.originalPrice!)}
                  </span>
                  <span className="text-xs font-medium text-red-500">-{discountPct}%</span>
                </div>
              )}
              {!discountPct && priceCompare && (
                <p className={cn('text-xs', priceCompare.positive ? 'text-green-600' : 'text-red-500')}>
                  {priceCompare.text}
                </p>
              )}
            </div>
          </td>
        )
      case 'bonus':
        return !col.bonus ? null : (
          <td key="bonus" style={tdBase}>
            <div style={cellDiv({ justifyContent: 'center', alignItems: 'center', gap: 4 })}>
              {myDiscount && (
                <span className="inline-flex items-center rounded-full bg-[#EDE9FE] px-3 py-0.5 text-xs font-medium text-[#5B21B6]">
                  {t('special_offer')}
                </span>
              )}
              {offer.bonus && (
                <span className={cn('inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium', bonusStyles[offer.bonus.type])}>
                  {offer.bonus.label}
                </span>
              )}
              {!myDiscount && !offer.bonus && (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>
          </td>
        )
      default:
        return null
    }
  }

  return (
    <tr className="group border-b border-gray-100 bg-white transition-colors hover:bg-gray-50 dark:border-[#333333] dark:bg-[#222222] dark:hover:bg-gray-800">
      {/* № */}
      <td style={{ ...tdBase, borderRight: '1px solid var(--table-cell-border)' }}>
        <div style={cellDiv({ alignItems: 'center' })}>
          <span className="text-xs text-gray-400">{index}</span>
        </div>
      </td>

      {colOrder.map((key) => renderCell(key))}

      {/* Количество — sticky right */}
      {col.quantity && (
        <td style={{
          padding: 0, position: 'sticky', right: 0, zIndex: 2,
          background: 'var(--table-row-bg)', borderLeft: '1px solid var(--table-cell-border)', borderBottom: '1px solid var(--table-cell-border)', overflow: 'hidden',
        }}
          className="group-hover:bg-gray-50 transition-colors dark:group-hover:bg-gray-800"
        >
          <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <QuantityControl value={quantity} onChange={(v) => onQuantityChange(offer.id, v)} />
          </div>
        </td>
      )}
    </tr>
  )
}
