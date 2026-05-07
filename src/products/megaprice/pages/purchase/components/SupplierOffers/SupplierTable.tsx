import { useState, useRef } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SupplierRow } from './SupplierRow'
import type { SupplierOffer, SortField, SortDirection, ColumnKey } from '@/products/megaprice/pages/purchase/types/purchase.types'

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
    <div className="dark:bg-[#111111]" style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
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
  )
}
