import { useMemo, useState, useRef, useEffect } from 'react'
import { Package, ArrowUp, ArrowDown, ArrowUpDown, AlignJustify, Check, ChevronDown, X } from 'lucide-react'
import { mockSupplierOffers, mockMedicines } from '@/products/megaprice/mocks/purchase.mocks'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import { QuantityControl } from './SupplierOffers/QuantityControl'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { cn } from '@/shared/utils/utils'
import type { Distributor, BonusType, ColumnKey, SortField, SortDirection } from '@/products/megaprice/pages/purchase/types/purchase.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistributorProductsProps {
  distributor: Distributor | null
}

type ColWidths = {
  num: number; medicine: number; expiry: number; payment: number
  price: number; bonus: number; manufacturer: number; country: number; quantity: number
}

type ReorderColKey = 'medicine' | 'expiry' | 'payment' | 'price' | 'bonus' | 'manufacturer' | 'country'

const ALWAYS_VISIBLE = new Set<ReorderColKey>(['medicine', 'manufacturer', 'country'])
const DEFAULT_ORDER: ReorderColKey[] = ['medicine', 'expiry', 'payment', 'price', 'bonus', 'manufacturer', 'country']

const COL_LABELS: Record<ReorderColKey, string> = {
  medicine:     'Препарат',
  expiry:       'Годен до',
  payment:      'Оплата',
  price:        'Цена с НДС',
  bonus:        'Бонусы',
  manufacturer: 'Производитель',
  country:      'Страна',
}

const INIT_COLS: ColWidths = {
  num: 48, medicine: 400, expiry: 160, payment: 160,
  price: 160, bonus: 160, manufacturer: 162, country: 134, quantity: 180,
}

const ROW_H = 56

const bonusOptions: { value: BonusType; label: string }[] = [
  { value: 'cashback',      label: 'Кэшбэк'         },
  { value: 'gift',          label: '+Товар'          },
  { value: 'free_delivery', label: 'Беспл. доставка' },
  { value: 'discount',      label: 'Скидка'          },
]

const columnOptions: { key: ColumnKey; label: string }[] = [
  { key: 'expiry',   label: 'Годен до'   },
  { key: 'payment',  label: 'Оплата'     },
  { key: 'price',    label: 'Цена с НДС' },
  { key: 'bonus',    label: 'Бонусы'     },
  { key: 'quantity', label: 'Количество' },
]

const bonusStyles: Record<BonusType, string> = {
  cashback:      'bg-[#D1FAE5] text-[#065F46]',
  gift:          'bg-[#FEF3C7] text-[#92400E]',
  free_delivery: 'bg-[#DBEAFE] text-[#1E40AF]',
  discount:      'bg-[#FEE2E2] text-[#991B1B]',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return ref
}

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
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
  if (sortDir === 'asc')   return <ArrowUp    className="h-3.5 w-3.5 text-gray-700" />
  return                          <ArrowDown   className="h-3.5 w-3.5 text-gray-700" />
}

const thBase: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 2,
  background: '#F9FAFB', borderBottom: '1px solid #e5e7eb',
  padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
}
const tdBase: React.CSSProperties = {
  padding: 0, overflow: 'hidden', borderBottom: '1px solid #f3f4f6',
}
const cellDiv = (extra?: React.CSSProperties): React.CSSProperties => ({
  height: ROW_H, display: 'flex', flexDirection: 'column', justifyContent: 'center',
  overflow: 'hidden', padding: '0 16px', whiteSpace: 'nowrap', ...extra,
})

// ─── FiltersBar ───────────────────────────────────────────────────────────────

function FiltersBar({
  manufacturers, countries, mnns,
  manufacturerFilter, onManufacturer,
  countryFilter, onCountry,
  bonusFilter, onBonus,
  mnnFilter, onMnn,
  visibleColumns, onToggleColumn,
}: {
  manufacturers: string[]
  countries: string[]
  mnns: string[]
  manufacturerFilter: string[]
  onManufacturer: (v: string[]) => void
  countryFilter: string[]
  onCountry: (v: string[]) => void
  bonusFilter: BonusType[]
  onBonus: (v: BonusType[]) => void
  mnnFilter: string[]
  onMnn: (v: string[]) => void
  visibleColumns: Record<ColumnKey, boolean>
  onToggleColumn: (k: ColumnKey) => void
}) {
  const [openMfg,   setOpenMfg]   = useState(false)
  const [openCtry,  setOpenCtry]  = useState(false)
  const [openBonus, setOpenBonus] = useState(false)
  const [openMnn,   setOpenMnn]   = useState(false)
  const [mnnSearch, setMnnSearch] = useState('')
  const [openCols,  setOpenCols]  = useState(false)

  const mfgRef   = useClickOutside(() => setOpenMfg(false))
  const ctryRef  = useClickOutside(() => setOpenCtry(false))
  const bonusRef = useClickOutside(() => setOpenBonus(false))
  const mnnRef   = useClickOutside(() => { setOpenMnn(false); setMnnSearch('') })
  const colsRef  = useClickOutside(() => setOpenCols(false))

  const mnnInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (openMnn) { setMnnSearch(''); setTimeout(() => mnnInputRef.current?.focus(), 50) }
  }, [openMnn])

  const hasFilter = manufacturerFilter.length > 0 || countryFilter.length > 0 || bonusFilter.length > 0 || mnnFilter.length > 0

  function toggle<T>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  function SimpleDropdown({ ref: r, open, onToggle, label, count, items, selected, onToggleItem, onClear }: {
    ref: React.RefObject<HTMLDivElement | null>
    open: boolean; onToggle: () => void; label: string; count: number
    items: string[]; selected: string[]; onToggleItem: (v: string) => void; onClear: () => void
  }) {
    return (
      <div ref={r} className="relative">
        <button onClick={onToggle} className={cn(
          'flex h-9 w-[180px] items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors',
          open ? 'border-gray-400 bg-white text-gray-900'
            : count > 0 ? 'border-gray-300 bg-white text-gray-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
        )}>
          <span className="truncate">{count > 0 ? `${label} · ${count}` : label}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute left-0 top-10 z-50 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <div className="max-h-52 overflow-y-auto">
              {items.map((item) => {
                const checked = selected.includes(item)
                return (
                  <label key={item} onClick={() => onToggleItem(item)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50">
                    <div className={cn('flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300')}>
                      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm text-gray-700">{item}</span>
                  </label>
                )
              })}
            </div>
            {selected.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600">Сбросить</button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
      <SimpleDropdown ref={mfgRef} open={openMfg} onToggle={() => setOpenMfg(v => !v)}
        label="Производитель" count={manufacturerFilter.length}
        items={manufacturers} selected={manufacturerFilter}
        onToggleItem={(v) => toggle(manufacturerFilter, v, onManufacturer)} onClear={() => onManufacturer([])} />
      <SimpleDropdown ref={ctryRef} open={openCtry} onToggle={() => setOpenCtry(v => !v)}
        label="Страна" count={countryFilter.length}
        items={countries} selected={countryFilter}
        onToggleItem={(v) => toggle(countryFilter, v, onCountry)} onClear={() => onCountry([])} />
      {/* МНН с поиском */}
      <div ref={mnnRef} className="relative">
        <button onClick={() => setOpenMnn(v => !v)} className={cn(
          'flex h-9 w-[180px] items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors',
          openMnn ? 'border-gray-400 bg-white text-gray-900'
            : mnnFilter.length > 0 ? 'border-gray-300 bg-white text-gray-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
        )}>
          <span className="truncate">{mnnFilter.length > 0 ? `МНН · ${mnnFilter.length}` : 'МНН'}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', openMnn && 'rotate-180')} />
        </button>
        {openMnn && (
          <div className="absolute left-0 top-10 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 p-2">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  ref={mnnInputRef}
                  type="text"
                  value={mnnSearch}
                  onChange={(e) => setMnnSearch(e.target.value)}
                  placeholder="Поиск..."
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white"
                />
                {mnnSearch && (
                  <button onClick={(e) => { e.stopPropagation(); setMnnSearch('') }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {mnns.filter(m => m.toLowerCase().includes(mnnSearch.toLowerCase())).length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400">Ничего не найдено</p>
              ) : (
                mnns.filter(m => m.toLowerCase().includes(mnnSearch.toLowerCase())).map((m) => {
                  const checked = mnnFilter.includes(m)
                  return (
                    <label key={m} onClick={() => toggle(mnnFilter, m, onMnn)}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50">
                      <div className={cn('flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300')}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className="truncate text-sm text-gray-700">{m}</span>
                    </label>
                  )
                })
              )}
            </div>
            {mnnFilter.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button onClick={() => onMnn([])} className="text-xs text-gray-400 hover:text-gray-600">Сбросить всё</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Бонусы */}
      <div ref={bonusRef} className="relative">
        <button onClick={() => setOpenBonus((v) => !v)} className={cn(
          'flex h-9 w-[180px] items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors',
          openBonus ? 'border-gray-400 bg-white text-gray-900'
            : bonusFilter.length ? 'border-gray-300 bg-white text-gray-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
        )}>
          <span className="truncate">{bonusFilter.length ? `Бонусы · ${bonusFilter.length}` : 'Бонусы'}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', openBonus && 'rotate-180')} />
        </button>
        {openBonus && (
          <div className="absolute left-0 top-10 z-50 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {bonusOptions.map((b) => {
              const checked = bonusFilter.includes(b.value)
              return (
                <label key={b.value} onClick={() => toggle(bonusFilter, b.value, onBonus)}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50">
                  <div className={cn('flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                    checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300')}>
                    {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-700">{b.label}</span>
                </label>
              )
            })}
            {bonusFilter.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button onClick={() => onBonus([])} className="text-xs text-gray-400 hover:text-gray-600">Сбросить</button>
              </div>
            )}
          </div>
        )}
      </div>

      {hasFilter && (
        <button onClick={() => { onManufacturer([]); onCountry([]); onBonus([]); onMnn([]) }}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-100">
          <X className="h-3.5 w-3.5" />
          Очистить
        </button>
      )}

      {/* Column toggle */}
      <div ref={colsRef} className="relative ml-auto">
        <button onClick={() => setOpenCols((v) => !v)} className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
          openCols ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        )}>
          <AlignJustify className="h-4 w-4" />
        </button>
        {openCols && (
          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Столбцы</p>
            {columnOptions.map((col) => {
              const checked = visibleColumns[col.key]
              return (
                <label key={col.key} onClick={() => onToggleColumn(col.key)}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50">
                  <div className={cn('flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                    checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300')}>
                    {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-700">{col.label}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DistributorProducts ──────────────────────────────────────────────────────

export function DistributorProducts({ distributor }: DistributorProductsProps) {
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([])
  const [countryFilter,      setCountryFilter]      = useState<string[]>([])
  const [bonusFilter,        setBonusFilter]        = useState<BonusType[]>([])
  const [mnnFilter,          setMnnFilter]          = useState<string[]>([])
  const [visibleColumns,     setVisibleColumns]     = useState<Record<ColumnKey, boolean>>({
    expiry: true, payment: true, price: true, bonus: true, quantity: true,
  })
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir,   setSortDir]   = useState<SortDirection>('asc')
  const [cols,      setCols]      = useState<ColWidths>(INIT_COLS)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Column drag & drop
  const [colOrder, setColOrder] = useState<ReorderColKey[]>(DEFAULT_ORDER)
  const dragColRef = useRef<ReorderColKey | null>(null)
  const [overCol,  setOverCol]  = useState<ReorderColKey | null>(null)

  const { addItem, removeItem } = usePurchaseCart()
  const col = visibleColumns

  // Visible columns in drag order
  const visibleOrder = useMemo(
    () => colOrder.filter((k) => ALWAYS_VISIBLE.has(k) || col[k as ColumnKey]),
    [colOrder, col]
  )

  const products = useMemo(() => {
    if (!distributor) return []
    return mockSupplierOffers
      .filter((o) => o.distributor.id === distributor.id)
      .map((o) => ({ offer: o, medicine: mockMedicines.find((m) => m.id === o.medicineId) }))
      .filter((x) => x.medicine != null) as { offer: (typeof mockSupplierOffers)[0]; medicine: (typeof mockMedicines)[0] }[]
  }, [distributor])

  const avgPrice = useMemo(() => {
    if (!products.length) return 0
    return products.reduce((s, p) => s + p.offer.priceWithVat, 0) / products.length
  }, [products])

  const manufacturers = useMemo(() => Array.from(new Set(products.map((p) => p.medicine.manufacturer))).sort(), [products])
  const countries     = useMemo(() => Array.from(new Set(products.map((p) => p.medicine.country))).sort(), [products])
  const mnns          = useMemo(() => Array.from(new Set(products.map((p) => p.medicine.mnn).filter(Boolean))).sort(), [products])

  const filtered = useMemo(() => {
    let list = products
    if (manufacturerFilter.length) list = list.filter((p) => manufacturerFilter.includes(p.medicine.manufacturer))
    if (countryFilter.length)      list = list.filter((p) => countryFilter.includes(p.medicine.country))
    if (bonusFilter.length)        list = list.filter((p) => p.offer.bonus && bonusFilter.includes(p.offer.bonus.type))
    if (mnnFilter.length)          list = list.filter((p) => mnnFilter.includes(p.medicine.mnn))
    if (sortField === 'price') {
      list = [...list].sort((a, b) => sortDir === 'asc' ? a.offer.priceWithVat - b.offer.priceWithVat : b.offer.priceWithVat - a.offer.priceWithVat)
    } else if (sortField === 'expiry') {
      list = [...list].sort((a, b) => {
        const da = new Date(a.offer.expiryDate).getTime(), db = new Date(b.offer.expiryDate).getTime()
        return sortDir === 'asc' ? da - db : db - da
      })
    }
    return list
  }, [products, manufacturerFilter, countryFilter, bonusFilter, mnnFilter, sortField, sortDir])

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function handleQtyChange(offerId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [offerId]: qty }))
    const product = products.find((p) => p.offer.id === offerId)
    if (!product) return
    if (qty <= 0) removeItem(offerId)
    else addItem({ offerId, medicineId: product.medicine.id, quantity: qty, offer: product.offer, medicine: product.medicine })
  }

  function startResize(e: React.MouseEvent, key: keyof ColWidths) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startW = cols[key]
    function onMove(ev: MouseEvent) { setCols((prev) => ({ ...prev, [key]: Math.max(48, startW + ev.clientX - startX) })) }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = '' }
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }

  // Column drag handlers
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

  // Render a header <th> for a given column key
  function renderTh(key: ReorderColKey) {
    const isDragOver = overCol === key && dragColRef.current !== key
    const isBeingDragged = dragColRef.current === key
    const colKey = key as keyof ColWidths
    const dragProps = {
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => handleColDragStart(e, key),
      onDragOver:  (e: React.DragEvent) => handleColDragOver(e, key),
      onDrop:      (e: React.DragEvent) => { e.preventDefault(); handleColDrop(key) },
      onDragEnd:   handleColDragEnd,
    }
    const borderStyle: React.CSSProperties = isDragOver
      ? { borderLeft: '2px solid #3B82F6' }
      : { borderRight: '1px solid #e5e7eb' }
    const baseStyle: React.CSSProperties = {
      ...thBase, ...borderStyle,
      position: 'relative', cursor: 'grab',
      opacity: isBeingDragged ? 0.45 : 1,
    }

    if (key === 'expiry' || key === 'price') {
      const field = key as SortField
      return (
        <th key={key} {...dragProps} style={baseStyle} onClick={() => handleSort(field)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, paddingRight: 8, cursor: 'pointer' }}>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{COL_LABELS[key]}</span>
            <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
          </span>
          <ResizeHandle onMouseDown={(e) => { e.stopPropagation(); startResize(e, colKey) }} />
        </th>
      )
    }

    return (
      <th key={key} {...dragProps} style={baseStyle}>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500" style={{ paddingRight: 8 }}>
          {COL_LABELS[key]}
        </span>
        <ResizeHandle onMouseDown={(e) => { e.stopPropagation(); startResize(e, colKey) }} />
      </th>
    )
  }

  // Render a body <td> for a given column key
  function renderTd(key: ReorderColKey, offer: typeof filtered[0]['offer'], medicine: typeof filtered[0]['medicine'], expiryLabel: { text: string; urgent: boolean } | null, priceCompare: { text: string; positive: boolean } | null, discountPct: number | null) {
    switch (key) {
      case 'medicine':
        return (
          <td key="medicine" style={tdBase}>
            <div style={cellDiv()}>
              <p className="truncate text-sm font-medium text-gray-900">{medicine.name}</p>
              <p className="truncate text-xs text-gray-400">{medicine.mnn}</p>
            </div>
          </td>
        )
      case 'expiry':
        return (
          <td key="expiry" style={tdBase}>
            <div style={cellDiv()}>
              <p className={cn('text-sm', expiryLabel ? 'font-medium text-red-600' : 'text-gray-700')}>
                {formatDate(offer.expiryDate)}
              </p>
              {expiryLabel && <p className="text-xs text-red-500">{expiryLabel.text}</p>}
            </div>
          </td>
        )
      case 'payment':
        return (
          <td key="payment" style={tdBase}>
            <div style={cellDiv()}>
              <p className="truncate text-sm text-gray-700">
                {offer.paymentTypes.map((p) => p.percentage === null ? 'Договорная' : `${p.percentage}%`).join(' \\ ')}
              </p>
            </div>
          </td>
        )
      case 'price':
        return (
          <td key="price" style={tdBase}>
            <div style={cellDiv({ alignItems: 'flex-end' })}>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(offer.priceWithVat)}</span>
              {offer.originalPrice && discountPct && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 line-through">{formatCurrency(offer.originalPrice)}</span>
                  <span className="text-xs font-medium text-red-500">-{discountPct}%</span>
                </div>
              )}
              {!offer.originalPrice && priceCompare && (
                <p className={cn('text-xs', priceCompare.positive ? 'text-green-600' : 'text-red-500')}>
                  {priceCompare.text}
                </p>
              )}
            </div>
          </td>
        )
      case 'bonus':
        return (
          <td key="bonus" style={tdBase}>
            <div style={cellDiv({ justifyContent: 'center', alignItems: 'center' })}>
              {offer.bonus ? (
                <span className={cn('inline-flex items-center rounded-full px-4 py-1 text-xs font-medium', bonusStyles[offer.bonus.type])}>
                  {offer.bonus.label}
                </span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>
          </td>
        )
      case 'manufacturer':
        return (
          <td key="manufacturer" style={tdBase}>
            <div style={cellDiv()}>
              <p className="truncate text-sm text-gray-700">{medicine.manufacturer}</p>
            </div>
          </td>
        )
      case 'country':
        return (
          <td key="country" style={tdBase}>
            <div style={cellDiv()}>
              <p className="truncate text-sm text-gray-600">{medicine.country}</p>
            </div>
          </td>
        )
    }
  }

  if (!distributor) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-xl bg-gray-100 p-5">
          <Package className="h-10 w-10 text-gray-400" />
        </div>
        <div>
          <p className="text-base font-medium text-gray-700">Выберите дистрибутора</p>
          <p className="mt-1 text-sm text-gray-400">из списка слева</p>
        </div>
      </div>
    )
  }

  const tableWidth = cols.num
    + visibleOrder.reduce((s, k) => s + cols[k as keyof ColWidths], 0)
    + (col.quantity ? cols.quantity : 0)

  return (
    <div className="flex h-full flex-col overflow-hidden">

      <FiltersBar
        manufacturers={manufacturers} countries={countries} mnns={mnns}
        manufacturerFilter={manufacturerFilter} onManufacturer={setManufacturerFilter}
        countryFilter={countryFilter} onCountry={setCountryFilter}
        bonusFilter={bonusFilter} onBonus={setBonusFilter}
        mnnFilter={mnnFilter} onMnn={setMnnFilter}
        visibleColumns={visibleColumns}
        onToggleColumn={(k) => setVisibleColumns((prev) => ({ ...prev, [k]: !prev[k] }))}
      />

      <div style={{ flex: 1, minHeight: 0, overflowX: 'scroll', overflowY: 'scroll' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm text-gray-400">Нет товаров в прайсе</p>
          </div>
        ) : (
          <table style={{ tableLayout: 'fixed', width: tableWidth, borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: cols.num }} />
              {visibleOrder.map((k) => <col key={k} style={{ width: cols[k as keyof ColWidths] }} />)}
              {col.quantity && <col style={{ width: cols.quantity }} />}
            </colgroup>

            <thead>
              <tr style={{ height: 48 }}>
                <th style={{ ...thBase, textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">№</span>
                </th>

                {visibleOrder.map((k) => renderTh(k))}

                {col.quantity && (
                  <th style={{ position: 'sticky', top: 0, right: 0, zIndex: 4, background: '#F9FAFB', borderBottom: '1px solid #e5e7eb', borderLeft: '1px solid #e5e7eb', padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Количество</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {filtered.map(({ offer, medicine }, index) => {
                const qty = quantities[offer.id] ?? 0
                const days = Math.floor((new Date(offer.expiryDate).getTime() - Date.now()) / 86400000)
                const expiryLabel = days < 0 ? { text: 'Просрочен', urgent: true }
                  : days < 30  ? { text: 'Остался < 1 мес.', urgent: true }
                  : days < 180 ? { text: `Осталось ${Math.floor(days / 30)} мес.`, urgent: true }
                  : null
                const avgDiff = avgPrice && avgPrice !== offer.priceWithVat
                  ? Math.round(Math.abs((offer.priceWithVat - avgPrice) / avgPrice) * 100)
                  : 0
                const priceCompare = avgDiff >= 3
                  ? offer.priceWithVat < avgPrice
                    ? { text: `Цена ниже на ${avgDiff}%`, positive: true }
                    : { text: `Цена выше на ${avgDiff}%`, positive: false }
                  : null
                const discountPct = offer.originalPrice
                  ? Math.round((1 - offer.priceWithVat / offer.originalPrice) * 100)
                  : null

                return (
                  <tr key={offer.id} className="group border-b border-gray-100 transition-colors hover:bg-gray-50">
                    <td style={{ ...tdBase, borderRight: '1px solid #f3f4f6' }}>
                      <div style={cellDiv({ alignItems: 'center' })}>
                        <span className="text-xs text-gray-400">{index + 1}</span>
                      </div>
                    </td>

                    {visibleOrder.map((k) => renderTd(k, offer, medicine, expiryLabel, priceCompare, discountPct))}

                    {col.quantity && (
                      <td style={{ padding: 0, position: 'sticky', right: 0, zIndex: 2, background: '#FFFFFF', borderLeft: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', overflow: 'hidden' }}
                        className="group-hover:bg-gray-50 transition-colors">
                        <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                          <QuantityControl value={qty} onChange={(v) => handleQtyChange(offer.id, v)} />
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
