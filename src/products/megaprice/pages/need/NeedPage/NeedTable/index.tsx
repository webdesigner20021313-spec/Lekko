import { useRef, useState, useEffect } from 'react'
import type { CSSProperties, DragEvent, MouseEvent } from 'react'
import { Package, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { NeedItem } from '@/products/megaprice/mocks/need.mocks'
import {
  COL_ACTION, COL_CB, COL_MFR, DEFAULT_ORDER, DRAWER_W, INIT_WIDTHS, MIN_NAME, STATUS_STYLE,
} from '../config'
import { calcRecommendedQty } from '../helpers'
import type { ColKey, ColWidths } from '../types'
import { DocBar } from '../DocBar'
import { ResizeHandle } from '../ResizeHandle'

/** Desktop-таблица потребности с drag-and-drop колонок и ресайзом. */
export function NeedTable({
  filtered,
  periodDays,
  checkedIds,
  allChecked,
  someChecked,
  drawerItemId,
  onRowClick,
  onSelectAll,
  onToggleCheck,
  onShowAI,
}: {
  filtered: NeedItem[]
  periodDays: number
  checkedIds: string[]
  allChecked: boolean
  someChecked: boolean
  drawerItemId: string | null
  onRowClick: (item: NeedItem) => void
  onSelectAll: () => void
  onToggleCheck: (id: string, e: MouseEvent) => void
  onShowAI: (item: NeedItem) => void
}) {
  const { t } = useTranslation()

  // Контейнер нужен для расчёта nameW (растягивается на остаток ширины).
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(900)
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const [colWidths, setColWidths] = useState<ColWidths>(INIT_WIDTHS)
  const [colOrder, setColOrder]   = useState<ColKey[]>(DEFAULT_ORDER)
  const dragColRef = useRef<ColKey | null>(null)
  const [overCol, setOverCol] = useState<ColKey | null>(null)

  function startResize(e: MouseEvent, key: ColKey) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startW = colWidths[key]
    function onMove(ev: globalThis.MouseEvent) { setColWidths(prev => ({ ...prev, [key]: Math.max(60, startW + ev.clientX - startX) })) }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = '' }
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }

  function handleColDragStart(e: DragEvent, key: ColKey) { dragColRef.current = key; e.dataTransfer.effectAllowed = 'move' }
  function handleColDragOver(e: DragEvent, key: ColKey) { e.preventDefault(); if (overCol !== key) setOverCol(key) }
  function handleColDrop(key: ColKey) {
    const from = dragColRef.current
    if (!from || from === key) { dragColRef.current = null; setOverCol(null); return }
    const next = [...colOrder]; const fi = next.indexOf(from), ti = next.indexOf(key)
    next.splice(fi, 1); next.splice(ti, 0, from)
    setColOrder(next); dragColRef.current = null; setOverCol(null)
  }
  function handleColDragEnd() { dragColRef.current = null; setOverCol(null) }

  function getColLabel(key: ColKey): string {
    switch (key) {
      case 'status': return t('need_col_status')
      case 'stock':  return t('need_col_stock')
      case 'doc':    return t('need_col_doc')
      case 'sales':  return t('need_col_sales')
      case 'need':   return t('need_col_need')
    }
  }

  const reorderableW = colOrder.reduce((s, k) => s + colWidths[k], 0)
  const drawerOpen   = drawerItemId !== null
  const nameW  = Math.max(MIN_NAME, containerW - COL_CB - COL_MFR - reorderableW - COL_ACTION - (drawerOpen ? DRAWER_W : 0))
  const tableW = COL_CB + nameW + COL_MFR + reorderableW + COL_ACTION

  const thBase: CSSProperties = {
    position: 'sticky', top: 0, zIndex: 2, height: 48,
    background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)',
    padding: '0 12px', whiteSpace: 'nowrap', overflow: 'hidden',
  }

  function renderTh(key: ColKey) {
    const isDragOver  = overCol === key && dragColRef.current !== key
    const borderStyle: CSSProperties = isDragOver
      ? { borderLeft: '2px solid #3B82F6', borderRight: '1px solid var(--table-border)' }
      : { borderRight: '1px solid var(--table-border)' }
    const dragProps = {
      draggable: true as const,
      onDragStart: (e: DragEvent) => handleColDragStart(e, key),
      onDragOver:  (e: DragEvent) => handleColDragOver(e, key),
      onDrop:      (e: DragEvent) => { e.preventDefault(); handleColDrop(key) },
      onDragEnd:   handleColDragEnd,
    }
    return (
      <th key={key} {...dragProps}
        style={{ ...thBase, ...borderStyle, cursor: 'grab', textAlign: key === 'stock' || key === 'sales' || key === 'need' ? 'right' : 'left' }}>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]" style={{ paddingRight: 8 }}>
          {getColLabel(key)}
        </span>
        <ResizeHandle onMouseDown={e => { e.stopPropagation(); startResize(e, key) }} />
      </th>
    )
  }

  function renderCell(key: ColKey, item: NeedItem, recQty: number) {
    const cfg    = STATUS_STYLE[item.status]
    const isDead = item.status === 'dead'
    const tdBase: CSSProperties = { padding: '0 12px', borderRight: '1px solid var(--table-cell-border)' }

    switch (key) {
      case 'status':
        return (
          <td key="status" style={tdBase}>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', cfg.badgeCls)}>
              {t(`need_status_${item.status}`)}
            </span>
          </td>
        )
      case 'stock':
        return (
          <td key="stock" style={{ ...tdBase, textAlign: 'right' }}>
            <span className={cn('text-sm tabular-nums font-medium',
              item.stock === 0 ? 'text-red-500 font-bold' : isDead ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300')}>
              {item.stock === 0 ? '—' : item.stock}
            </span>
          </td>
        )
      case 'doc':
        return (
          <td key="doc" style={tdBase}>
            <DocBar days={item.daysOfCover} />
          </td>
        )
      case 'sales':
        return (
          <td key="sales" style={{ ...tdBase, textAlign: 'right' }}>
            <span className={cn('text-sm tabular-nums', isDead ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400')}>
              {item.avgDailySales.toFixed(1)}
            </span>
          </td>
        )
      case 'need':
        return (
          <td key="need" style={{ ...tdBase, textAlign: 'right' }}>
            {recQty > 0
              ? <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{recQty}</span>
              : <span className="text-sm text-gray-300 dark:text-gray-600">—</span>}
          </td>
        )
      default: return null
    }
  }

  return (
    <div ref={containerRef} className="hidden md:block flex-1 overflow-x-auto overflow-y-auto">
      <table style={{ tableLayout: 'fixed', width: tableW, minWidth: tableW, borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: COL_CB }} />
          <col style={{ width: nameW }} />
          <col style={{ width: COL_MFR }} />
          {colOrder.map(k => <col key={k} style={{ width: colWidths[k] }} />)}
          <col style={{ width: COL_ACTION }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...thBase, padding: 0, textAlign: 'center', borderRight: '1px solid var(--table-border)' }}>
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="checkbox" checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked }}
                  onChange={onSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900" />
              </div>
            </th>
            <th style={{ ...thBase, textAlign: 'left', borderRight: '1px solid var(--table-border)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">{t('need_th_name')}</span>
            </th>
            <th style={{ ...thBase, textAlign: 'left', borderRight: '1px solid var(--table-border)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">{t('filter_manufacturer')}</span>
            </th>
            {colOrder.map(k => renderTh(k))}
            <th style={{ ...thBase, position: 'sticky', right: 0, zIndex: 4, padding: 0, borderLeft: '1px solid var(--table-border)' }} />
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={3 + colOrder.length}>
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="mb-3 rounded-2xl bg-gray-100 p-5 dark:bg-[#222222]">
                    <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-[#929292]">{t('need_empty_filtered')}</p>
                </div>
              </td>
            </tr>
          ) : filtered.map(item => {
            const cfg       = STATUS_STYLE[item.status]
            const isChecked = checkedIds.includes(item.id)
            const isOpen    = drawerItemId === item.id
            const recQty    = calcRecommendedQty(item, periodDays)

            return (
              <tr key={item.id}
                onClick={() => onRowClick(item)}
                className="group cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-[#333333] dark:hover:bg-gray-800"
                style={{ background: isOpen ? 'var(--need-open-row-bg)' : (cfg.rowBg ? 'var(--need-oos-row-bg)' : undefined) }}>

                <td style={{ padding: 0, position: 'relative', borderRight: '1px solid var(--table-cell-border)' }}
                  onClick={e => onToggleCheck(item.id, e)}>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.borderColor, borderRadius: '0 2px 2px 0' }} />
                  <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input type="checkbox" checked={isChecked} onChange={() => {}}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900" />
                  </div>
                </td>

                <td style={{ padding: '0 12px', overflow: 'hidden', borderRight: '1px solid var(--table-cell-border)' }}>
                  <div style={{ height: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                    <p className={cn('truncate text-sm font-medium', item.status === 'dead' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100')}>
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-[#929292]">{item.group}</p>
                  </div>
                </td>

                <td style={{ padding: '0 12px', overflow: 'hidden', borderRight: '1px solid var(--table-cell-border)' }}>
                  <div style={{ height: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                    <p className="truncate text-sm text-gray-700 dark:text-gray-300">{item.manufacturer}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-[#929292]">{item.country}</p>
                  </div>
                </td>

                {colOrder.map(k => renderCell(k, item, recQty))}

                <td
                  style={{ position: 'sticky', right: 0, zIndex: 2, padding: '0 10px', borderLeft: '1px solid var(--table-cell-border)', background: isOpen ? 'var(--need-open-row-bg)' : (cfg.rowBg ? 'var(--need-oos-row-bg)' : 'var(--table-row-bg)') }}
                  className="transition-colors group-hover:bg-gray-50 dark:group-hover:bg-[#222222]"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => onShowAI(item)}
                    title="AI"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-gray-400 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </td>

              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
