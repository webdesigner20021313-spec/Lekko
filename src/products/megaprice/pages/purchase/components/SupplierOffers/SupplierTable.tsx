import { useState, useRef } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { SupplierRow } from './SupplierRow'
import { QuantityControl } from './QuantityControl'
import { useWholesalersStore } from '@/products/megaprice/stores/useWholesalersStore'
import type { SupplierOffer, SortField, SortDirection, ColumnKey, BonusType } from '@/products/megaprice/pages/purchase/types/purchase.types'

const bonusStylesMobile: Record<BonusType, string> = {
  cashback:      'bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]',
  gift:          'bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]',
  free_delivery: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD]',
  discount:      'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]',
}

function MobileOfferCard({ offer, avgPrice, quantity, onQuantityChange }: {
  offer: SupplierOffer
  avgPrice: number
  quantity: number
  onQuantityChange: (id: string, q: number) => void
}) {
  const { t } = useTranslation()
  const myDiscount = useWholesalersStore(s => s.getDiscount(offer.distributor.name))
  const effectivePrice = myDiscount ? Math.round(offer.priceWithVat * (1 - myDiscount / 100)) : offer.priceWithVat
  const discountPct = myDiscount ? myDiscount : (offer.originalPrice ? Math.round((1 - offer.priceWithVat / offer.originalPrice) * 100) : null)

  const expiry = new Date(offer.expiryDate)
  const diffDays = Math.floor((expiry.getTime() - Date.now()) / 86400000)
  const expiryUrgent = diffDays < 180

  const priceVsAvg = avgPrice && avgPrice !== effectivePrice
    ? Math.round(((effectivePrice - avgPrice) / avgPrice) * 100)
    : null
  const isCheaper = priceVsAvg !== null && priceVsAvg < -2
  const isPricier = priceVsAvg !== null && priceVsAvg > 2

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border bg-white dark:bg-[#090909]',
      quantity > 0 ? 'border-gray-900 dark:border-[#f1f1f1]' : 'border-gray-200 dark:border-gray-700',
    )}>
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{offer.distributor.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-[#929292]">{offer.distributor.city}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn('text-base font-bold tabular-nums',
            isCheaper ? 'text-green-600 dark:text-green-400' : isPricier ? 'text-red-500' : 'text-gray-900 dark:text-gray-100',
          )}>{formatCurrency(effectivePrice)}</p>
          {discountPct && (
            <div className="flex items-center justify-end gap-1">
              <span className="text-[10px] text-gray-400 line-through">{formatCurrency(myDiscount ? offer.priceWithVat : offer.originalPrice!)}</span>
              <span className="text-[10px] font-bold text-red-500">-{discountPct}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
          expiryUrgent
            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        )}>
          {t('col_expiry')}: {formatDate(offer.expiryDate)}
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {t('col_payment')}: {offer.paymentTypes.map(p => p.percentage === null ? t('payment_negotiable') : `${p.percentage}%`).join(' / ')}
        </span>
        {myDiscount && (
          <span className="inline-flex items-center rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-medium text-[#5B21B6]">
            {t('special_offer')}
          </span>
        )}
        {offer.bonus && (
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', bonusStylesMobile[offer.bonus.type])}>
            {offer.bonus.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
        <span className="text-xs font-medium text-gray-500 dark:text-[#929292]">{t('col_quantity')}</span>
        <div className="w-[140px] shrink-0">
          <QuantityControl value={quantity} onChange={(v) => onQuantityChange(offer.id, v)} />
        </div>
      </div>
    </div>
  )
}

interface SupplierTableProps {
  offers: SupplierOffer[]
  avgPrice: number
  quantities: Record<string, number>
  onQuantityChange: (offerId: string, quantity: number) => void
  sortField: SortField | null
  sortDir: SortDirection
  onSort: (field: SortField) => void
  visibleColumns: Record<ColumnKey, boolean>
}

export type Col2Widths = {
  num: number; distributor: number; expiry: number
  payment: number; price: number; bonus: number; quantity: number
}

export type ReorderColKey = 'distributor' | 'expiry' | 'payment' | 'price' | 'bonus'

const INIT_COLS: Col2Widths = {
  num: 48, distributor: 264, expiry: 160,
  payment: 160, price: 160, bonus: 160, quantity: 180,
}

const DEFAULT_ORDER: ReorderColKey[] = ['distributor', 'expiry', 'payment', 'price', 'bonus']

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={onMouseDown}
      style={{ position: 'absolute', right: 0, top: 0, width: 4, height: '100%', cursor: 'col-resize', zIndex: 10 }}
      className="hover:bg-blue-400 active:bg-blue-500"
    />
  )
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDirection }) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 dark:text-[#929292]" />
  if (sortDir === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
  return <ArrowDown className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
}

export function SupplierTable({ offers, avgPrice, quantities, onQuantityChange, sortField, sortDir, onSort, visibleColumns }: SupplierTableProps) {
  const { t } = useTranslation()

  function colLabel(key: ReorderColKey): string {
    switch (key) {
      case 'distributor': return t('col_distributor')
      case 'expiry':      return t('col_expiry')
      case 'payment':     return t('col_payment')
      case 'price':       return t('col_price_vat')
      case 'bonus':       return t('filter_bonuses')
    }
  }
  const col = visibleColumns
  const [cols, setCols] = useState<Col2Widths>(INIT_COLS)
  const [colOrder, setColOrder] = useState<ReorderColKey[]>(DEFAULT_ORDER)
  const dragColRef = useRef<ReorderColKey | null>(null)
  const [overCol, setOverCol] = useState<ReorderColKey | null>(null)

  // Visible columns in current order
  const visibleOrder = colOrder.filter((k) =>
    k === 'distributor' || col[k as ColumnKey]
  )

  const tableWidth = cols.num
    + visibleOrder.reduce((s, k) => s + cols[k], 0)
    + (col.quantity ? cols.quantity : 0)

  function startResize(e: React.MouseEvent, key: keyof Col2Widths) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startW = cols[key]
    function onMove(ev: MouseEvent) { setCols(prev => ({ ...prev, [key]: Math.max(80, startW + ev.clientX - startX) })) }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function handleColDragStart(e: React.DragEvent, key: ReorderColKey) {
    dragColRef.current = key
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleColDragOver(e: React.DragEvent, key: ReorderColKey) {
    e.preventDefault()
    if (overCol !== key) setOverCol(key)
  }
  function handleColDrop(key: ReorderColKey) {
    const from = dragColRef.current
    if (!from || from === key) { dragColRef.current = null; setOverCol(null); return }
    const next = [...colOrder]
    const fi = next.indexOf(from), ti = next.indexOf(key)
    next.splice(fi, 1); next.splice(ti, 0, from)
    setColOrder(next)
    dragColRef.current = null; setOverCol(null)
  }
  function handleColDragEnd() { dragColRef.current = null; setOverCol(null) }

  const thBase: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 2,
    background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)',
    padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
  }

  function renderTh(key: ReorderColKey) {
    const isDragOver = overCol === key && dragColRef.current !== key
    const dragProps = {
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => handleColDragStart(e, key),
      onDragOver: (e: React.DragEvent) => handleColDragOver(e, key),
      onDrop: (e: React.DragEvent) => { e.preventDefault(); handleColDrop(key) },
      onDragEnd: handleColDragEnd,
    }
    const borderStyle: React.CSSProperties = isDragOver
      ? { borderLeft: '2px solid #3B82F6' }
      : { borderRight: '1px solid var(--table-border)' }

    if (key === 'expiry' || key === 'price') {
      const field = key === 'expiry' ? 'expiry' : 'price'
      return (
        <th key={key} {...dragProps}
          style={{ ...thBase, ...borderStyle, cursor: 'grab' }}
          onClick={() => onSort(field)}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, paddingRight: 8, cursor: 'pointer' }}>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">{colLabel(key)}</span>
            <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
          </span>
          <ResizeHandle onMouseDown={(e) => { e.stopPropagation(); startResize(e, key) }} />
        </th>
      )
    }

    return (
      <th key={key} {...dragProps}
        style={{ ...thBase, ...borderStyle, cursor: 'grab' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]" style={{ paddingRight: 8 }}>
          {colLabel(key)}
        </span>
        <ResizeHandle onMouseDown={(e) => { e.stopPropagation(); startResize(e, key) }} />
      </th>
    )
  }

  return (
    <>
    {/* Mobile cards */}
    <div className="md:hidden h-full overflow-y-auto bg-gray-50 px-3 py-3 dark:bg-[#0a0a0a]">
      <div className="space-y-2.5">
        {offers.map(offer => (
          <MobileOfferCard
            key={offer.id}
            offer={offer}
            avgPrice={avgPrice}
            quantity={quantities[offer.id] ?? 0}
            onQuantityChange={onQuantityChange}
          />
        ))}
        {offers.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-[#929292]">{t('medicines_not_found')}</div>
        )}
      </div>
    </div>

    {/* Desktop table */}
    <div className="hidden md:block dark:bg-[#090909]" style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
      <table style={{ tableLayout: 'fixed', width: tableWidth, borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: cols.num }} />
          {visibleOrder.map((k) => <col key={k} style={{ width: cols[k] }} />)}
          {col.quantity && <col style={{ width: cols.quantity }} />}
        </colgroup>
        <thead>
          <tr style={{ height: 48 }}>
            <th style={{ ...thBase, textAlign: 'center', borderRight: '1px solid var(--table-border)' }}>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">№</span>
            </th>

            {visibleOrder.map((k) => renderTh(k))}

            {col.quantity && (
              <th style={{
                position: 'sticky', top: 0, right: 0, zIndex: 4,
                background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)',
                borderLeft: '1px solid var(--table-border)', padding: '10px 16px', whiteSpace: 'nowrap',
              }}>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">{t('col_quantity')}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, index) => (
            <SupplierRow
              key={offer.id}
              offer={offer}
              index={index + 1}
              cols={cols}
              avgPrice={avgPrice}
              quantity={quantities[offer.id] ?? 0}
              onQuantityChange={onQuantityChange}
              visibleColumns={col}
              colOrder={visibleOrder}
            />
          ))}
        </tbody>
      </table>
    </div>
    </>
  )
}
