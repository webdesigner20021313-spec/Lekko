import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Search, X, Package, Building2,
  ChevronDown, Check, Zap, TrendingDown, Plus, Download, Star, Calendar,
  Sparkles, ArrowRightLeft, AlertTriangle, ShoppingCart as CartIcon,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import { useToast } from '@/shared/ui-kit/Toaster'
import { mockNeedItems, type NeedItem, type NeedStatus } from '@/products/megaprice/mocks/need.mocks'
import { mockSupplierOffers } from '@/products/megaprice/mocks/purchase.mocks'
import type { SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'

// Precomputed offer count per medicine (статичный мап для быстрого доступа)
const OFFER_COUNT: Record<string, number> = {}
mockSupplierOffers.forEach(o => {
  OFFER_COUNT[o.medicineId] = (OFFER_COUNT[o.medicineId] ?? 0) + 1
})

// ─── Types ────────────────────────────────────────────────────────────────────

type ScenarioKey = 'urgent' | 'oos' | 'overstock' | 'dead' | 'all'
type PeriodKey   = '7d' | '30d' | '90d' | '1y' | 'custom'
type ColKey      = 'status' | 'stock' | 'doc' | 'sales' | 'need'
interface PharmacyBreakdown {
  id: string
  name: string
  stock: number
  sales30d: number
  avgDailySales: number
  daysOfCover: number
  status: NeedStatus
}

// ─── Pharmacy list ────────────────────────────────────────────────────────────

const PHARMACIES: { id: string; name: string }[] = [
  { id: 'ph1', name: 'Дорилар дунёси (Мирабад)' },
  { id: 'ph2', name: 'Шифо (Юнусабад)' },
  { id: 'ph3', name: 'Здоровье (Чиланзар)' },
  { id: 'ph4', name: 'Hayot Dori (Самарканд)' },
  { id: 'ph5', name: 'Nasiba Dori (Фергана)' },
  { id: 'ph6', name: 'Дорихона (Ташкент)' },
  { id: 'ph7', name: 'Медикус (Андижан)' },
]

function getItemPharmacies(item: NeedItem): PharmacyBreakdown[] {
  const seed      = item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const baseFracs = [0.26, 0.22, 0.19, 0.14, 0.10, 0.06, 0.03]
  return PHARMACIES.map((ph, i) => {
    const fi            = (i + seed) % baseFracs.length
    const frac          = baseFracs[fi]
    const sales30d      = Math.max(0, Math.round(item.sales30d * frac))
    const avgDailySales = parseFloat((item.avgDailySales * frac).toFixed(1))
    const stockBase     = item.status === 'oos' ? 0 : item.stock * frac * (1 + ((seed + i) % 3) * 0.15)
    const stock         = Math.round(stockBase)
    const daysOfCover   = avgDailySales > 0 ? stock / avgDailySales : 0
    let status: NeedStatus
    if (stock === 0) status = 'oos'
    else if (daysOfCover < 7) status = 'critical'
    else if (daysOfCover > 30) status = 'overstock'
    else status = 'normal'
    return { ...ph, stock, sales30d, avgDailySales, daysOfCover, status }
  })
}

// ─── Per-pharmacy item transformation ────────────────────────────────────────

function getPharmacyItems(pharmacyId: string): NeedItem[] {
  return mockNeedItems.flatMap(item => {
    const phData = getItemPharmacies(item).find(ph => ph.id === pharmacyId)
    if (!phData || (phData.stock === 0 && phData.sales30d === 0)) return []
    const salesRatio = item.avgDailySales > 0 ? phData.avgDailySales / item.avgDailySales : 0
    return [{
      ...item,
      stock:            phData.stock,
      avgDailySales:    phData.avgDailySales,
      sales30d:         phData.sales30d,
      sales7d:          Math.round(item.sales7d * salesRatio),
      daysOfCover:      phData.daysOfCover,
      status:           phData.status,
      optimalStock:     Math.max(1, Math.round(item.optimalStock * salesRatio)),
      lostRevenuePerDay: phData.status === 'oos' ? item.lostRevenuePerDay * salesRatio : 0,
      frozenAmount:     (phData.status === 'overstock' || phData.status === 'dead')
        ? item.frozenAmount * (item.stock > 0 ? phData.stock / item.stock : 0)
        : 0,
      recommendedQty:   Math.max(0, Math.ceil(phData.avgDailySales * 7) - phData.stock),
    }]
  })
}

function getMultiPharmacyItems(ids: string[]): NeedItem[] {
  if (ids.length === 0) return mockNeedItems
  if (ids.length === 1) return getPharmacyItems(ids[0])
  return mockNeedItems.flatMap(item => {
    const phList = getItemPharmacies(item).filter(ph => ids.includes(ph.id))
    if (phList.length === 0) return []
    const stockSum    = phList.reduce((s, ph) => s + ph.stock, 0)
    const salesSum    = parseFloat(phList.reduce((s, ph) => s + ph.avgDailySales, 0).toFixed(1))
    const sales30dSum = phList.reduce((s, ph) => s + ph.sales30d, 0)
    if (stockSum === 0 && sales30dSum === 0) return []
    const salesRatio  = item.avgDailySales > 0 ? salesSum / item.avgDailySales : 0
    const daysOfCover = salesSum > 0 ? stockSum / salesSum : 0
    let status: NeedStatus
    if (stockSum === 0) status = 'oos'
    else if (daysOfCover < 7) status = 'critical'
    else if (daysOfCover > 30) status = 'overstock'
    else status = 'normal'
    return [{
      ...item,
      stock:             stockSum,
      avgDailySales:     salesSum,
      sales30d:          sales30dSum,
      sales7d:           Math.round(item.sales7d * salesRatio),
      daysOfCover,
      status,
      optimalStock:      Math.max(1, Math.round(item.optimalStock * salesRatio)),
      lostRevenuePerDay: status === 'oos' ? item.lostRevenuePerDay * salesRatio : 0,
      frozenAmount:      (status === 'overstock' || status === 'dead')
        ? item.frozenAmount * (item.stock > 0 ? stockSum / item.stock : 0)
        : 0,
      recommendedQty:    Math.max(0, Math.ceil(salesSum * 7) - stockSum),
    }]
  })
}

// ─── InfoTooltip ─────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      <div className="flex h-4 w-4 cursor-default select-none items-center justify-center rounded-full bg-gray-400 hover:bg-gray-500 transition-colors">
        <span className="text-[9px] font-bold leading-none text-white">!</span>
      </div>
      {show && (
        <div className="absolute right-0 top-5 z-50 w-52 rounded-lg bg-gray-900 p-2.5 shadow-lg">
          <p className="text-xs leading-snug text-white">{text}</p>
        </div>
      )}
    </div>
  )
}

// ─── Resize handle ────────────────────────────────────────────────────────────

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      draggable={false}
      onDragStart={e => e.preventDefault()}
      onMouseDown={onMouseDown}
      style={{ position: 'absolute', right: 0, top: 0, width: 4, height: '100%', cursor: 'col-resize', zIndex: 10 }}
      className="hover:bg-blue-400 active:bg-blue-500"
    />
  )
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр']

const STATUS_CFG: Record<NeedStatus, { label: string; badgeCls: string; borderColor: string; rowBg: string }> = {
  oos:       { label: 'Нет в наличии', badgeCls: 'bg-[#FEE2E2] text-[#991B1B]', borderColor: '#EF4444', rowBg: '#FFF8F8' },
  critical:  { label: 'Критично',      badgeCls: 'bg-[#FEF3C7] text-[#92400E]', borderColor: '#F59E0B', rowBg: '' },
  normal:    { label: 'В норме',       badgeCls: 'bg-[#D1FAE5] text-[#065F46]', borderColor: '#10B981', rowBg: '' },
  overstock: { label: 'Избыток',       badgeCls: 'bg-[#DBEAFE] text-[#1E40AF]', borderColor: '#3B82F6', rowBg: '' },
  dead:      { label: 'Мёртвый сток',  badgeCls: 'bg-[#F3F4F6] text-[#374151]', borderColor: '#9CA3AF', rowBg: '' },
}

const STATUS_ORDER: Record<NeedStatus, number> = { oos: 0, critical: 1, normal: 2, overstock: 3, dead: 4 }

const SCENARIOS: { key: ScenarioKey; label: string; filter: (i: NeedItem[]) => NeedItem[] }[] = [
  { key: 'urgent',    label: 'Купить сейчас',  filter: i => i.filter(x => x.status === 'oos' || x.status === 'critical') },
  { key: 'oos',       label: 'OOS',            filter: i => i.filter(x => x.status === 'oos') },
  { key: 'overstock', label: 'Overstock',      filter: i => i.filter(x => x.status === 'overstock' || x.status === 'dead') },
  { key: 'dead',      label: 'Мёртвый сток',   filter: i => i.filter(x => x.status === 'dead') },
  { key: 'all',       label: 'Все товары',     filter: i => i },
]

const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: '7d',     label: '7 дней',      days: 7   },
  { key: '30d',    label: '30 дней',     days: 30  },
  { key: '90d',    label: '90 дней',     days: 90  },
  { key: '1y',     label: '1 год',       days: 365 },
  { key: 'custom', label: 'Свой период', days: 30  },
]

const GROUPS = Array.from(new Set(mockNeedItems.map(i => i.group))).sort()

const COL_LABELS: Record<ColKey, string> = {
  status: 'Статус',
  stock:  'Остаток',
  doc:    'Хватит на',
  sales:  'Продажи/дн.',
  need:   'Нужно заказать',
}

const DEFAULT_ORDER: ColKey[] = ['status', 'stock', 'doc', 'sales', 'need']

type ColWidths = Record<ColKey, number>
const INIT_WIDTHS: ColWidths = { status: 180, stock: 180, doc: 180, sales: 180, need: 180 }

const COL_CB     = 40
const COL_MFR    = 280
const COL_ACTION = 52
const MIN_NAME   = 232
const DRAWER_W   = 580

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcRecommendedQty(item: NeedItem, days: number): number {
  if (item.status === 'overstock' || item.status === 'dead') return 0
  return Math.max(0, Math.ceil(item.avgDailySales * days) - item.stock)
}

function calcKpi(items: NeedItem[], periodDays: number) {
  const oos       = items.filter(i => i.status === 'oos')
  const critical  = items.filter(i => i.status === 'critical')
  const overstock = items.filter(i => i.status === 'overstock' || i.status === 'dead')
  const urgent    = items.filter(i => i.status === 'oos' || i.status === 'critical')
  const lostPerDay     = oos.reduce((s, i) => s + i.lostRevenuePerDay, 0)
  const frozenTotal    = overstock.reduce((s, i) => s + i.frozenAmount, 0)
  const orderTotal     = items.reduce((s, i) => s + calcRecommendedQty(i, periodDays) * i.costPrice, 0)
  const orderCount     = items.filter(i => calcRecommendedQty(i, periodDays) > 0).length
  const urgentTotal    = urgent.reduce((s, i) => s + calcRecommendedQty(i, periodDays) * i.costPrice, 0)
  const urgentCount    = urgent.filter(i => calcRecommendedQty(i, periodDays) > 0).length
  return { oos, critical, overstock, lostPerDay, frozenTotal, orderTotal, orderCount, urgentTotal, urgentCount }
}

function defaultSort(a: NeedItem, b: NeedItem) {
  const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  if (so !== 0) return so
  return b.avgDailySales - a.avgDailySales
}

function getBestOffer(medicineId: string) {
  return mockSupplierOffers
    .filter(o => o.medicineId === medicineId)
    .sort((a, b) => a.priceWithVat - b.priceWithVat)[0] ?? null
}

function getAllOffers(medicineId: string): SupplierOffer[] {
  return mockSupplierOffers
    .filter(o => o.medicineId === medicineId)
    .sort((a, b) => a.priceWithVat - b.priceWithVat)
}

// ─── DocBar ───────────────────────────────────────────────────────────────────

function DocBar({ days }: { days: number }) {
  return <span className="text-sm text-gray-700 tabular-nums">{Math.round(days)} дн.</span>
}

// ─── MiniBarChart with hover tooltip ─────────────────────────────────────────

function MiniBarChart({ data }: { data: number[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartW, setChartW] = useState(296)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setChartW(Math.floor(e[0].contentRect.width)))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const max = Math.max(...data, 1)
  const W = chartW; const H = 72; const gap = 3
  const bw = Math.floor((W - gap * (data.length - 1)) / data.length)

  const hovBh    = hoveredIdx !== null ? Math.max(3, (data[hoveredIdx] / max) * H) : 0
  const tooltipX = hoveredIdx !== null ? hoveredIdx * (bw + gap) + bw / 2 : 0
  const tooltipY = hoveredIdx !== null ? H - hovBh - 26 : 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          left: tooltipX,
          top: Math.max(0, tooltipY),
          transform: 'translateX(-50%)',
          background: '#111827',
          color: '#fff',
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {MONTHS_SHORT[hoveredIdx]}: {data[hoveredIdx]} шт.
        </div>
      )}
      <svg width="100%" height={H + 14} style={{ overflow: 'visible', display: 'block' }}>
        {data.map((v, i) => {
          const bh     = Math.max(3, (v / max) * H)
          const x      = i * (bw + gap)
          const isHov  = hoveredIdx === i
          const isLast = i === data.length - 1
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}>
              {/* transparent hit area */}
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              <rect x={x} y={H - bh} width={bw} height={bh} rx={2}
                fill={isHov ? '#374151' : isLast ? '#111827' : '#E5E7EB'} />
              {(i === 0 || i === 5 || i === 11) && (
                <text x={x + bw / 2} y={H + 12} textAnchor="middle" fontSize={9} fill="#9CA3AF">
                  {MONTHS_SHORT[i]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── OffersModal ─────────────────────────────────────────────────────────────

function OffersModal({ item, currentOfferId, onSelectOffer, onClose }: {
  item: NeedItem
  currentOfferId: string | null
  onSelectOffer: (offer: SupplierOffer) => void
  onClose: () => void
}) {
  const offers    = getAllOffers(item.id)
  const bestPrice = offers[0]?.priceWithVat ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="flex w-[760px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="mt-0.5 text-xs text-gray-400">{item.manufacturer} · {item.country} · {item.group}</p>
            </div>
            <button onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Нет предложений от поставщиков на этот товар</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <th className="w-8 px-3 py-2.5" />
                  {['Дистрибутор', 'Город', 'Цена с НДС', 'Дата прайса', 'Срок годности', 'Бонус'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => {
                  const isBest    = offer.priceWithVat === bestPrice
                  const isSelected = (currentOfferId ?? offers[0]?.id) === offer.id
                  return (
                    <tr key={offer.id}
                      onClick={() => { onSelectOffer(offer); onClose() }}
                      className={cn(
                        'cursor-pointer border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50',
                        isBest && !isSelected ? 'bg-green-50' : 'bg-white',
                      )}>
                      {/* Radio */}
                      <td className="px-3 py-3">
                        <div className={cn('h-4 w-4 rounded-full border-2 flex items-center justify-center',
                          isSelected ? 'border-gray-900' : 'border-gray-300')}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-gray-900" />}
                        </div>
                      </td>
                      {/* Дистрибутор */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-900">{offer.distributor.name}</span>
                          {isBest && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                              <Star className="h-2.5 w-2.5" />
                              Лучшая
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Город */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-600">{offer.distributor.city}</span>
                      </td>
                      {/* Цена */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className={cn('text-xs font-bold tabular-nums', isBest ? 'text-green-700' : 'text-gray-900')}>
                            {formatCurrency(offer.priceWithVat)}
                          </span>
                          {offer.originalPrice && (
                            <span className="text-[10px] text-gray-400 tabular-nums line-through">
                              {formatCurrency(offer.originalPrice)}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Дата прайса */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500">{offer.distributor.lastPriceDate}</span>
                      </td>
                      {/* Срок годности */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500">{offer.expiryDate}</span>
                      </td>
                      {/* Бонус */}
                      <td className="px-3 py-3">
                        {offer.bonus
                          ? <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{offer.bonus.label}</span>
                          : <span className="text-xs text-gray-300">—</span>
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

// ─── NeedDrawer ───────────────────────────────────────────────────────────────

function NeedDrawer({ item, periodDays, selectedPharmacyIds, activeOffer, onClose, onAddToCart, onShowOffers }: {
  item: NeedItem
  periodDays: number
  selectedPharmacyIds: string[]
  activeOffer: SupplierOffer | null
  onClose: () => void
  onAddToCart: (item: NeedItem, qty: number) => void
  onShowOffers: (item: NeedItem) => void
}) {
  const cfg        = STATUS_CFG[item.status]
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
  }, [item.id, periodDays])

  const oosDays   = item.oosSince
    ? Math.floor((new Date('2026-04-28').getTime() - new Date(item.oosSince).getTime()) / 86400000)
    : 0
  const totalLost = oosDays * item.lostRevenuePerDay
  const orderCost = qty * (bestOffer?.priceWithVat ?? item.costPrice)
  const excessQty = Math.max(0, item.stock - item.optimalStock)

  return (
    <div className="flex h-full shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white"
      style={{ width: DRAWER_W, minWidth: DRAWER_W }}>

      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-gray-900">{item.name}</p>
            <p className="mt-0.5 text-xs text-gray-400">{item.manufacturer} · {item.country} · {item.group}</p>
          </div>
          <button onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg.badgeCls)}>
            {cfg.label}
          </span>
          {item.status === 'oos' && oosDays > 0 && (
            <span className="text-xs text-red-500">Закончился {oosDays} {oosDays === 1 ? 'день' : oosDays < 5 ? 'дня' : 'дней'} назад</span>
          )}
          {item.status === 'critical' && (
            <span className="text-xs text-amber-600">Хватит на {Math.round(item.daysOfCover)} дн.</span>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Metrics grid */}
        <div className="mx-4 mt-6 grid grid-cols-3 gap-2">
          {[
            { label: 'Остаток',      value: item.stock === 0 ? 'Нет' : `${item.stock} шт.`,           color: item.stock === 0 ? '#EF4444' : undefined },
            { label: 'Продажи/день', value: `${item.avgDailySales.toFixed(1)} шт.` },
            { label: 'Хватит на',   value: item.daysOfCover === 0 ? '0 дней' : `${Math.round(item.daysOfCover)} дн.`, color: item.daysOfCover === 0 ? '#EF4444' : undefined },
            { label: 'Цена продажи', value: formatCurrency(item.salePrice) },
            { label: 'Закупочная',   value: formatCurrency(item.costPrice) },
            { label: 'Продажи/мес.', value: `${item.sales30d} шт.` },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-2">
              <p className="text-xs font-normal text-gray-400">{label}</p>
              <p className="mt-2 text-sm font-semibold text-gray-900" style={color ? { color } : undefined}>{value}</p>
            </div>
          ))}
        </div>

        {/* OOS losses */}
        {item.status === 'oos' && item.lostRevenuePerDay > 0 && (
          <div className="mx-4 mt-4 rounded-xl bg-gray-900 p-4">
            <div className="mb-6 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white">Финансовые потери</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] text-white">В день</p>
                <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-red-400">{formatCurrency(item.lostRevenuePerDay)}</p>
              </div>
              {oosDays > 0 && (
                <div className="text-right">
                  <p className="text-[11px] text-white">Уже потеряно за {oosDays} {oosDays === 1 ? 'день' : oosDays < 5 ? 'дня' : 'дней'}</p>
                  <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-red-400">{formatCurrency(totalLost)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overstock frozen */}
        {(item.status === 'overstock' || item.status === 'dead') && item.frozenAmount > 0 && (
          <div className="mx-4 mt-4 rounded-xl bg-gray-900 p-4">
            <div className="mb-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white">Замороженный капитал</span>
              </div>
              <span className="text-[12px] text-gray-300">в наличии {item.stock} шт. · избыток {excessQty} шт.</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] text-white">В запасах</p>
                <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-white">{formatCurrency(item.frozenAmount)}</p>
              </div>
              {item.avgDailySales > 0 && (
                <div className="text-right">
                  <p className="text-[11px] text-white">Распродастся за</p>
                  <p className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-white">~{Math.round(item.stock / item.avgDailySales)} дн.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="mx-4 mt-6">
          <p className="mb-3 text-xs font-semibold text-gray-900">Продажи — последние 12 месяцев</p>
          <MiniBarChart data={item.monthlySales} />
        </div>

        {/* Pharmacy analytics */}
        <div className="mx-4 mt-6 mb-6">
          <p className="mb-2 text-xs font-semibold text-gray-900">Наличие по аптекам</p>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Аптека</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Остаток</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Прод/мес</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Статус</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((ph, idx) => {
                  const phCfg = STATUS_CFG[ph.status]
                  return (
                    <tr key={ph.id}
                      className={cn('border-b border-gray-100 last:border-0', idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white')}>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-gray-800" style={{ maxWidth: 130 }}>{ph.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <span className={cn('text-xs font-semibold', ph.stock === 0 ? 'text-red-500' : 'text-gray-700')}>
                          {ph.stock === 0 ? '—' : ph.stock}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <span className="text-xs text-gray-600">{ph.sales30d}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap', phCfg.badgeCls)}>
                          {phCfg.label}
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

      {/* ── Sticky bottom: order block ────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-200 bg-white p-4" style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' }}>
        {recQty > 0 ? (
          <>
            {bestOffer && (
              <div className="mb-2 flex items-center gap-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors text-sm font-bold">−</button>
                <input type="number" min={1} value={qty}
                  onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                  className="h-8 w-16 rounded-lg border border-gray-200 bg-white text-center text-sm font-semibold tabular-nums outline-none focus:border-gray-900" />
                <button onClick={() => setQty(q => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors text-sm font-bold">+</button>
                <span className="ml-auto text-[18px] font-bold text-gray-900">{formatCurrency(orderCost)}</span>
              </div>
            )}
            {bestOffer && (() => {
              const cheapestPrice = getAllOffers(item.id)[0]?.priceWithVat ?? 0
              const isActuallyBest = bestOffer.priceWithVat === cheapestPrice
              return (
                <button
                  onClick={() => onShowOffers(item)}
                  className="mb-3 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                  <span className="shrink-0">{isActuallyBest ? 'Лучшая цена:' : 'Выбранный дистрибутор:'}</span>
                  <span className="font-medium text-gray-700">{bestOffer.distributor.name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{bestOffer.distributor.city}</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-semibold text-gray-700 tabular-nums">{formatCurrency(bestOffer.priceWithVat)}/шт.</span>
                  {OFFER_COUNT[item.id] > 1 && (
                    <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                      +{OFFER_COUNT[item.id] - 1} ещё
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
                  ? 'bg-gray-900 text-white hover:bg-black'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400',
              )}>
              <Plus className="h-4 w-4" />
              Добавить в корзину
            </button>
            {!bestOffer && (
              <p className="mt-2 text-center text-xs text-red-500">Нет предложений от поставщиков на этот товар</p>
            )}
          </>
        ) : (
          <p className="py-1 text-center text-xs text-gray-400">Заказ не требуется</p>
        )}
      </div>
    </div>
  )
}

// ─── AI Recommendations ───────────────────────────────────────────────────────

// Детерминированный генератор на основе строки (без зависимостей)
function seededNum(seed: string, idx: number, min: number, max: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) ^ idx * 2654435761
  return min + Math.abs(h) % (max - min + 1)
}

interface BranchData {
  name:        string
  stock:       number   // остаток в этом филиале
  dailySales:  number   // средние продажи в день
  daysOfCover: number   // хватит на N дней
  expiryDays:  number   // дней до окончания самой ближней партии
}

// Короткое имя: «Здоровье» вместо «Филиал №1 «Здоровье»»
function shortBranch(name: string) { return name.replace(/^Филиал №\d+\s*/, '') }

const BRANCH_NAMES = [
  'Ул. Навои, 14',
  'Пр. Мустакиллик, 32',
  'Ул. Амира Темура, 8',
  'Ул. Бунёдкор, 21',
]

function buildBranchData(item: NeedItem): BranchData[] {
  const seed    = item.id
  const count   = 3 + (seededNum(seed, 99, 0, 1))  // 3 или 4 филиала
  const branches: BranchData[] = []

  // Распределяем общий сток и продажи по филиалам
  let remainStock = item.stock
  let remainSales = item.avgDailySales

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1
    const stockShare = isLast ? remainStock : Math.round(remainStock * seededNum(seed, i * 10, 15, 55) / 100)
    const salesShare = isLast ? Math.max(0, remainSales) : parseFloat((remainSales * seededNum(seed, i * 10 + 1, 5, 50) / 100).toFixed(1))

    // Для сценариев «мёртвый» и «overstock» — один филиал без продаж
    let effectiveSales = salesShare
    if ((item.status === 'dead' || item.status === 'overstock') && i === count - 1) {
      effectiveSales = 0
    }

    const daysOfCover = effectiveSales > 0 ? Math.round(stockShare / effectiveSales) : 999
    const expiryDays  = seededNum(seed, i * 10 + 5, 20, 180)

    branches.push({
      name:        BRANCH_NAMES[i],
      stock:       Math.max(0, stockShare),
      dailySales:  parseFloat(effectiveSales.toFixed(1)),
      daysOfCover,
      expiryDays,
    })

    remainStock -= stockShare
    remainSales -= salesShare
  }

  return branches
}

interface AIRec {
  id:           string
  severity:     'red' | 'orange' | 'blue'
  icon:         React.ReactNode
  badgeLabel:   string
  title:        string   // короткое название: "Срок годности истекает"
  headline:     string   // конкретика: "через 38 дн. — 2 шт."
  tableHeaders?: [string, string, string]
  tableRows?:    [string, string, string][]
  analysis?:    string
  loss?:        string
  steps:        string[]
}

function getAIRecommendations(item: NeedItem): AIRec[] {
  const recs: AIRec[] = []
  const fmt  = (n: number) => Math.round(n).toLocaleString('ru-RU')
  const branches = buildBranchData(item)

  const noSalesBranches    = branches.filter(b => b.dailySales === 0)
  const goodBranches       = branches.filter(b => b.dailySales >= 1.5).sort((a, b) => b.dailySales - a.dailySales)
  const expiryRiskBranches = branches.filter(b => b.expiryDays < 45 && b.stock > 0)
  const networkDailySales  = branches.reduce((s, b) => s + b.dailySales, 0)

  // ── Сценарий 1: в некоторых филиалах продаж нет ──────────────────────────
  if (noSalesBranches.length > 0 && goodBranches.length > 0 && item.stock > 0) {
    const transferQty = noSalesBranches.reduce((s, b) => s + b.stock, 0)
    const canAbsorb   = goodBranches.filter(b => {
      const afterTransfer = b.stock + Math.round(transferQty / goodBranches.length)
      const projectedDoc  = b.dailySales > 0 ? afterTransfer / b.dailySales : 999
      return projectedDoc <= b.expiryDays
    })
    const safeTargets = canAbsorb.length > 0 ? canAbsorb : goodBranches.slice(0, 2)
    const perBranch   = Math.round(transferQty / safeTargets.length)
    const riskyBranch = goodBranches.find(b => !canAbsorb.includes(b))

    const tableRows = noSalesBranches.map(b =>
      [shortBranch(b.name), '0 шт./день', `${fmt(b.stock)} шт.`] as [string, string, string]
    )

    const minExp = Math.min(...noSalesBranches.map(b => b.expiryDays))
    const analysisParts = noSalesBranches.some(b => b.expiryDays < 90)
      ? [`${fmt(transferQty)} шт. стоят без продаж, а срок годности через ${minExp} дн. Не перевезти сейчас — товар спишется.`]
      : [`${fmt(transferQty)} шт. стоят без движения — деньги заморожены. В других точках этот товар уходит хорошо.`]

    const steps: string[] = []
    // Откуда забрать — по каждому филиалу отдельно
    noSalesBranches.forEach(b => {
      steps.push(`Забрать ${fmt(b.stock)} шт. из ${shortBranch(b.name)}`)
    })
    // Куда везти — пропорционально продажам каждого филиала
    const totalTargetSales = safeTargets.reduce((s, b) => s + b.dailySales, 0)
    safeTargets.forEach(b => {
      const portion = totalTargetSales > 0
        ? Math.round(transferQty * (b.dailySales / totalTargetSales))
        : perBranch
      steps.push(`Везти ${fmt(portion)} шт. в ${shortBranch(b.name)}`)
    })
    if (riskyBranch) {
      steps.push(`В ${shortBranch(riskyBranch.name)} не везти — там запас на ${riskyBranch.daysOfCover} дн., не успеют продать`)
    }

    recs.push({
      id: 'transfer', severity: 'blue',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      badgeLabel: 'Нет движения',
      title: 'Товар не продаётся',
      headline: `${fmt(transferQty)} шт. простаивают в ${noSalesBranches.length > 1 ? noSalesBranches.length + ' филиалах' : shortBranch(noSalesBranches[0].name)}`,
      tableHeaders: ['Филиал', 'Продаж/день', 'Остаток'],
      tableRows,
      analysis: analysisParts.join(' '),
      steps,
    })
  }

  // ── Сценарий 2: срок годности скоро заканчивается ────────────────────────
  if (expiryRiskBranches.length > 0) {
    const atRiskQty  = expiryRiskBranches.reduce((s, b) => s + b.stock, 0)
    const atRiskLoss = atRiskQty * item.costPrice
    const minExpiry  = Math.min(...expiryRiskBranches.map(r => r.expiryDays))
    const fastBranches = branches
      .filter(b => b.dailySales >= 1 && !expiryRiskBranches.includes(b))
      .sort((a, b) => b.dailySales - a.dailySales).slice(0, 2)
    const canSellInTime = fastBranches.reduce((s, b) => s + Math.round(b.dailySales * minExpiry), 0)

    const tableRows = expiryRiskBranches.map(b =>
      [shortBranch(b.name), `${b.expiryDays} дн.`, `${fmt(b.stock)} шт.`] as [string, string, string]
    )

    // Анализ: общая картина по всем филиалам с риском
    const totalCanSell = expiryRiskBranches.reduce((s, b) => s + Math.round(b.dailySales * b.expiryDays), 0)
    const totalWillExpire = Math.max(0, atRiskQty - totalCanSell)
    let expiryAnalysis: string
    if (totalWillExpire > 0) {
      expiryAnalysis = `При текущем темпе продадут ${fmt(totalCanSell)} шт. — остальные ${fmt(totalWillExpire)} шт. уйдут в списание. Действовать нужно сейчас.`
    } else {
      expiryAnalysis = `Продать должны успеть, но запас на пределе. Если спрос чуть упадёт — часть товара просрочится.`
    }
    const analysisParts = [expiryAnalysis]

    const steps: string[] = []
    if (fastBranches.length > 0 && canSellInTime >= atRiskQty * 0.6) {
      const totalFastSales = fastBranches.reduce((s, b) => s + b.dailySales, 0)
      fastBranches.forEach(b => {
        const canTake = totalFastSales > 0
          ? Math.round(atRiskQty * (b.dailySales / totalFastSales))
          : Math.round(atRiskQty / fastBranches.length)
        steps.push(`Срочно перевезти ${fmt(canTake)} шт. в ${shortBranch(b.name)}`)
      })
    } else {
      steps.push(`Предложить ~${fmt(Math.round(atRiskQty * 0.5))} шт. оптом соседней аптеке`)
      steps.push(`Сделать скидку 20–25% — ускорить продажи пока не поздно`)
    }
    steps.push(`Новый заказ не делать до полной продажи текущего остатка`)

    recs.push({
      id: 'expiry', severity: 'orange',
      icon: <AlertTriangle className="h-4 w-4" />,
      badgeLabel: 'Срок годности',
      title: 'Срок годности истекает',
      headline: `через ${minExpiry} дн. — ${fmt(atRiskQty)} шт.`,
      tableHeaders: ['Филиал', 'До просрочки', 'Остаток'],
      tableRows,
      analysis: analysisParts.join(' '),
      loss: `${fmt(atRiskLoss)} сум`,
      steps,
    })
  }

  // ── Сценарий 3: товар плохо продаётся во всей сети ───────────────────────
  if (item.status === 'dead' || (networkDailySales < 0.5 && item.stock > 0)) {
    const minExpiry    = Math.min(...branches.map(b => b.expiryDays))
    const canSell      = networkDailySales > 0 ? Math.round(networkDailySales * minExpiry) : 0
    const willExpire   = Math.max(0, item.stock - canSell)
    const expireLoss   = willExpire * item.costPrice
    const monthsToSell = networkDailySales > 0 ? (item.stock / networkDailySales / 30).toFixed(1) : '∞'

    const tableRows = branches.map(b =>
      [shortBranch(b.name), `${b.dailySales.toFixed(1)} шт./день`, b.daysOfCover < 999 ? `${b.daysOfCover} дн.` : '—'] as [string, string, string]
    )

    const analysis = networkDailySales > 0
      ? `Весь остаток уйдёт за ~${monthsToSell} мес., а срок истекает через ${minExpiry} дн.${willExpire > 0 ? ` ${fmt(willExpire)} шт. просрочатся.` : ''}`
      : `Ни в одном филиале продаж нет. Весь остаток — ${fmt(item.stock)} шт. — просрочится через ${minExpiry} дн.`

    const steps = [
      `Предложить ${fmt(Math.round(item.stock * 0.4))}–${fmt(Math.round(item.stock * 0.5))} шт. оптом соседней аптеке`,
      `Сделать скидку 15–25% — нужно ускорить продажи`,
      `Исключить из плана закупок до роста спроса`,
    ]

    recs.push({
      id: 'dead_network', severity: 'red',
      icon: <TrendingDown className="h-4 w-4" />,
      badgeLabel: 'Не продаётся',
      title: 'Слабые продажи по всей сети',
      headline: `${networkDailySales.toFixed(1)} шт./день — реализация займёт ~${monthsToSell} мес.`,
      tableHeaders: ['Филиал', 'Продаж/день', 'Запас'],
      tableRows,
      analysis,
      loss: willExpire > 0 ? `${fmt(expireLoss)} сум` : undefined,
      steps,
    })
  }

  // ── Сценарий 4: критический остаток / OOS ────────────────────────────────
  if (item.status === 'oos' || item.status === 'critical') {
    const surplus = branches.filter(b => b.daysOfCover > 60).sort((a, b) => b.stock - a.stock)

    const tableRows = (surplus.length > 0 ? surplus : branches).map(b =>
      [shortBranch(b.name), b.daysOfCover < 999 ? `${b.daysOfCover} дн.` : '—', `${fmt(b.stock)} шт.`] as [string, string, string]
    )

    let analysis = ''
    if (item.status === 'oos') {
      analysis = surplus.length > 0
        ? `Каждый день без товара — ${fmt(item.lostRevenuePerDay)} сум потерянной выручки. В ${surplus.map(b => shortBranch(b.name)).join(' и ')} есть свободный запас — можно перевезти.`
        : `Каждый день без товара — ${fmt(item.lostRevenuePerDay)} сум потерянной выручки. Запасов в других точках нет — нужен срочный заказ.`
    } else {
      analysis = surplus.length > 0
        ? `Запаса хватит на ${Math.round(item.daysOfCover)} дн. — пора пополнять. В ${surplus.map(b => shortBranch(b.name)).join(' и ')} запас с излишком, можно взять оттуда.`
        : `Запаса хватит на ${Math.round(item.daysOfCover)} дн. Пополнить нужно до того, как закончится.`
    }

    const steps: string[] = []
    if (surplus.length > 0) {
      surplus.forEach(b => {
        const transferable = Math.round(b.stock * 0.4)
        steps.push(`Перевезти ${fmt(transferable)} шт. из ${shortBranch(b.name)}`)
      })
    } else {
      steps.push(`Сделать срочный заказ у поставщика — ${fmt(item.recommendedQty)} шт.`)
    }
    steps.push(`Добавить в ближайший заказ поставщику`)

    recs.push({
      id: 'oos', severity: 'red',
      icon: <CartIcon className="h-4 w-4" />,
      badgeLabel: item.status === 'oos' ? 'Нет в наличии' : 'Критично мало',
      title: item.status === 'oos' ? 'Товара нет в наличии' : 'Запас на исходе',
      headline: item.status === 'oos'
        ? `потери ${fmt(item.lostRevenuePerDay)} сум каждый день`
        : `хватит на ${Math.round(item.daysOfCover)} дн. при ${item.avgDailySales.toFixed(1)} шт./день`,
      tableHeaders: surplus.length > 0 ? ['Филиал (излишки)', 'Запас', 'Остаток'] : ['Филиал', 'Запас', 'Остаток'],
      tableRows,
      analysis,
      steps,
    })
  }

  return recs
}

// ── Severity visual tokens ────────────────────────────────────────────────────
const SEV_STYLE = {
  red:    { bar: 'bg-red-400',   badge: 'bg-red-50 text-red-500',    metric: 'text-red-500'    },
  orange: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-600', metric: 'text-amber-600' },
  blue:   { bar: 'bg-indigo-400',badge: 'bg-indigo-50 text-indigo-600', metric: 'text-indigo-600' },
} as const

function AIAdviceModal({ item, onClose }: { item: NeedItem; onClose: () => void }) {
  const recs = useMemo(() => getAIRecommendations(item), [item])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative flex w-full max-w-[460px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 leading-tight">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.manufacturer} · {item.country}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {recs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-50">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Всё в порядке</p>
              <p className="mt-1 text-xs text-gray-400">Товар продаётся нормально, проблем не обнаружено</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recs.map((rec) => {
                const sev = SEV_STYLE[rec.severity]
                return (
                  <div key={rec.id} className="flex">

                    {/* Левая полоска — индикатор серьёзности */}
                    <div className={cn('w-[3px] shrink-0', sev.bar)} />

                    {/* Контент карточки */}
                    <div className="flex-1 min-w-0 px-4 pt-4 pb-5">

                      {/* Строка 1: заголовок слева, бейдж + метрика справа */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[18px] font-bold text-gray-900 leading-snug">
                          {rec.title}
                        </p>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <span className={cn(
                            'inline-flex h-6 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium leading-none',
                            sev.badge
                          )}>
                            {rec.icon}
                            {rec.badgeLabel}
                          </span>
                        </div>
                      </div>

                      {/* Строка 3: анализ — чистый текст, без блоков */}
                      {rec.analysis && (
                        <p className="text-sm text-gray-500 leading-relaxed mb-3">
                          {rec.analysis}
                          {rec.loss && (
                            <> <span className="text-red-500">Потери: {rec.loss}.</span></>
                          )}
                        </p>
                      )}

                      {/* Строка 4: таблица — inline, без жирных рамок */}
                      {rec.tableRows && rec.tableRows.length > 0 && (
                        <div className="mb-4 overflow-hidden rounded-lg border border-gray-100">
                          {rec.tableHeaders && (
                            <div className="grid grid-cols-3 bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                              {rec.tableHeaders.map((h, hi) => (
                                <p key={hi} className={cn(
                                  'text-[10px] font-semibold uppercase tracking-wide text-gray-400',
                                  hi > 0 ? 'text-right' : 'text-left'
                                )}>{h}</p>
                              ))}
                            </div>
                          )}
                          {rec.tableRows.map((row, ri) => (
                            <div key={ri} className={cn(
                              'grid grid-cols-3 px-3 py-2 bg-white',
                              ri < rec.tableRows!.length - 1 && 'border-b border-gray-100'
                            )}>
                              <p className="truncate text-xs font-medium text-gray-700">{row[0]}</p>
                              <p className="text-right text-xs text-gray-500">{row[1]}</p>
                              <p className="text-right text-xs font-semibold text-gray-900">{row[2]}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Строка 5: шаги — чистый список без зелёного блока */}
                      <div className="border-t border-dashed border-gray-200 pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-900 mb-2.5">
                          Что сделать
                        </p>
                        <ul className="space-y-2">
                          {rec.steps.map((step, si) => (
                            <li key={si} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold leading-none text-white">
                                {si + 1}
                              </span>
                              <span className="text-sm text-gray-700 leading-snug">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3">
          <button
            onClick={onClose}
            className="h-10 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition-all duration-200 hover:bg-black"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RangeCalendar ───────────────────────────────────────────────────────────

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function toISO(d: Date) { return d.toISOString().slice(0, 10) }
function fmtDate(iso: string) {
  if (!iso) return ''
  const [y, m, day] = iso.split('-')
  return `${day}.${m}.${y}`
}

function RangeCalendar({ from, to, onChange }: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const today    = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())
  const [hover, setHover] = useState('')

  const prevM = () => { if (vm === 0) { setVy(y => y-1); setVm(11) } else setVm(m => m-1) }
  const nextM = () => { if (vm === 11) { setVy(y => y+1); setVm(0)  } else setVm(m => m+1) }

  // Build grid cells (Mon-start)
  const cells = useMemo(() => {
    const first = new Date(vy, vm, 1)
    const last  = new Date(vy, vm + 1, 0)
    const pad   = (first.getDay() + 6) % 7
    const arr: (Date | null)[] = Array(pad).fill(null)
    for (let d = 1; d <= last.getDate(); d++) arr.push(new Date(vy, vm, d))
    return arr
  }, [vy, vm])

  function handleClick(date: Date) {
    const iso = toISO(date)
    if (!from || (from && to)) {
      onChange(iso, '')
    } else {
      if (iso >= from) onChange(from, iso)
      else             onChange(iso, from)
    }
  }

  const todayISO = toISO(today)

  return (
    <div className="select-none">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <button onClick={prevM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100">
          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
        </button>
        <span className="text-xs font-semibold text-gray-700">{MONTHS_RU[vm]} {vy}</span>
        <button onClick={nextM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </button>
      </div>

      {/* Day names */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS_RU.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const iso  = toISO(date)
          const end  = to || hover
          const lo   = from && end ? (from <= end ? from : end) : from
          const hi   = from && end ? (from <= end ? end  : from) : ''
          const isF  = iso === from
          const isT  = iso === (to || (from && hover ? hover : ''))
          const inR  = !!lo && !!hi && iso > lo && iso < hi
          const isTod = iso === todayISO
          return (
            <button
              key={iso}
              onClick={() => handleClick(date)}
              onMouseEnter={() => { if (from && !to) setHover(iso) }}
              onMouseLeave={() => setHover('')}
              className={cn(
                'h-7 w-full text-xs transition-colors',
                (isF || isT)
                  ? 'rounded-full bg-gray-900 font-semibold text-white'
                  : inR
                    ? 'bg-gray-100 text-gray-800'
                    : cn('rounded-full text-gray-700 hover:bg-gray-100', isTod && 'font-bold'),
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Hint */}
      <p className="mt-2 text-center text-[10px] text-gray-400">
        {!from ? 'Выберите начало периода' : !to ? 'Выберите конец периода' : `${fmtDate(from)} — ${fmtDate(to)}`}
      </p>
    </div>
  )
}

// ─── NeedPage ─────────────────────────────────────────────────────────────────

export function NeedPage() {
  const { addItem } = usePurchaseCart()
  const { toast } = useToast()

  // Pharmacy multi-select
  const [selectedPharmacyIds, setSelectedPharmacyIds] = useState<string[]>([])
  const [pharmacyOpen, setPharmacyOpen]               = useState(false)

  // Other filters
  const [scenario] = useState<ScenarioKey>('all')
  const [period,       setPeriod]      = useState<PeriodKey>('30d')
  const [periodOpen,   setPeriodOpen]  = useState(false)
  const [customFrom,   setCustomFrom]  = useState('')
  const [customTo,     setCustomTo]    = useState('')
  const [search,       setSearch]      = useState('')
  const [minSales]    = useState('')
  const [groupFilter,  setGroupFilter] = useState<string | null>(null)
  const [groupOpen,    setGroupOpen]   = useState(false)
  const [statusFilter, setStatusFilter] = useState<NeedStatus[]>([])

  const [checkedIds,      setCheckedIds]      = useState<string[]>([])
  const [drawerItem,      setDrawerItem]      = useState<NeedItem | null>(null)
  const [offersModalItem, setOffersModalItem] = useState<NeedItem | null>(null)
  const [aiItem,          setAiItem]          = useState<NeedItem | null>(null)
  const [selectedOfferMap, setSelectedOfferMap] = useState<Record<string, SupplierOffer>>({})

  // Table container width → rubber name column
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(900)
  useEffect(() => {
    if (!tableContainerRef.current) return
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width))
    ro.observe(tableContainerRef.current)
    return () => ro.disconnect()
  }, [])

  // Column resize
  const [colWidths, setColWidths] = useState<ColWidths>(INIT_WIDTHS)

  function startResize(e: React.MouseEvent, key: ColKey) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startW = colWidths[key]
    function onMove(ev: MouseEvent) {
      setColWidths(prev => ({ ...prev, [key]: Math.max(60, startW + ev.clientX - startX) }))
    }
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

  // Column drag-and-drop reorder
  const [colOrder, setColOrder] = useState<ColKey[]>(DEFAULT_ORDER)
  const dragColRef = useRef<ColKey | null>(null)
  const [overCol, setOverCol]   = useState<ColKey | null>(null)

  function handleColDragStart(e: React.DragEvent, key: ColKey) {
    dragColRef.current = key
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleColDragOver(e: React.DragEvent, key: ColKey) {
    e.preventDefault()
    if (overCol !== key) setOverCol(key)
  }
  function handleColDrop(key: ColKey) {
    const from = dragColRef.current
    if (!from || from === key) { dragColRef.current = null; setOverCol(null); return }
    const next = [...colOrder]
    const fi = next.indexOf(from), ti = next.indexOf(key)
    next.splice(fi, 1); next.splice(ti, 0, from)
    setColOrder(next)
    dragColRef.current = null; setOverCol(null)
  }
  function handleColDragEnd() { dragColRef.current = null; setOverCol(null) }

  // Derived
  const periodDays = period === 'custom'
    ? (customFrom && customTo
        ? Math.max(1, Math.round((new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86_400_000))
        : 30)
    : PERIODS.find(p => p.key === period)!.days

  // Pharmacy-filtered base list — если выбрана аптека, данные пересчитываются под неё
  const pharmacyFiltered = useMemo(
    () => getMultiPharmacyItems(selectedPharmacyIds),
    [selectedPharmacyIds],
  )

  const kpi = useMemo(() => calcKpi(pharmacyFiltered, periodDays), [pharmacyFiltered, periodDays])

  const filtered = useMemo(() => {
    let list = SCENARIOS.find(s => s.key === scenario)!.filter(pharmacyFiltered)
    if (groupFilter) list = list.filter(i => i.group === groupFilter)
    if (statusFilter.length > 0) list = list.filter(i => statusFilter.includes(i.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.manufacturer.toLowerCase().includes(q))
    }
    const minVal = parseFloat(minSales)
    if (!isNaN(minVal) && minVal > 0) list = list.filter(i => i.avgDailySales >= minVal)
    return [...list].sort(defaultSort)
  }, [scenario, pharmacyFiltered, groupFilter, search, minSales, statusFilter])

  const allChecked  = filtered.length > 0 && filtered.every(i => checkedIds.includes(i.id))
  const someChecked = !allChecked && filtered.some(i => checkedIds.includes(i.id))

  const reorderableW = colOrder.reduce((s, k) => s + colWidths[k], 0)
  const drawerOpen   = drawerItem !== null
  const nameW  = Math.max(MIN_NAME, containerW - COL_CB - COL_MFR - reorderableW - COL_ACTION - (drawerOpen ? DRAWER_W : 0))
  const tableW = COL_CB + nameW + COL_MFR + reorderableW + COL_ACTION

  // Pharmacy dropdown label
  const pharmacyLabel = selectedPharmacyIds.length === 0
    ? `Все аптеки (${PHARMACIES.length})`
    : selectedPharmacyIds.length === 1
      ? (PHARMACIES.find(ph => ph.id === selectedPharmacyIds[0])?.name ?? 'Аптека')
      : `Аптеки · ${selectedPharmacyIds.length}`

  // KPI card filter click
  function handleKpiClick(statuses: NeedStatus[]) {
    const isActive = statuses.length === statusFilter.length &&
      statuses.every(s => statusFilter.includes(s))
    setStatusFilter(isActive ? [] : statuses)
  }

  function isKpiActive(statuses: NeedStatus[]) {
    return statuses.length === statusFilter.length &&
      statuses.every(s => statusFilter.includes(s))
  }

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (allChecked) setCheckedIds(p => p.filter(id => !filtered.some(i => i.id === id)))
    else setCheckedIds(p => Array.from(new Set([...p, ...filtered.map(i => i.id)])))
  }, [allChecked, filtered])

  function toggleCheck(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCheckedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const handleAddToCart = useCallback((item: NeedItem, qty: number, opts?: { silent?: boolean }) => {
    const offer = selectedOfferMap[item.id] ?? getBestOffer(item.id)
    if (!offer) return false
    addItem({
      offerId: offer.id, medicineId: item.id, quantity: qty, offer,
      medicine: { id: item.id, name: item.name, manufacturer: item.manufacturer, country: item.country, isFavorite: false, mnn: '', form: '', dosage: '', packageSize: '' } as any,
    })
    if (!opts?.silent) {
      toast({
        title: 'Добавлено в корзину',
        description: `${item.name} · ${qty} шт.`,
        variant: 'success',
      })
    }
    return true
  }, [addItem, selectedOfferMap, toast])

  function handleBulkAddToCart() {
    const selected = filtered.filter(i => checkedIds.includes(i.id))
    let added = 0
    selected.forEach(item => {
      const qty = calcRecommendedQty(item, periodDays)
      if (qty > 0 && handleAddToCart(item, qty, { silent: true })) added++
    })
    setCheckedIds([])
    if (added > 0) {
      toast({
        title: 'Добавлено в корзину',
        description: `${added} ${added === 1 ? 'позиция' : added < 5 ? 'позиции' : 'позиций'} из «Потребности»`,
        variant: 'success',
      })
    } else {
      toast({
        title: 'Нечего добавлять',
        description: 'У выбранных товаров нет предложений или количество = 0',
        variant: 'warning',
      })
    }
  }

  function handleExport() {
    const rows = filtered.map(item => {
      const bestOffer = getBestOffer(item.id)
      return {
        'Название':           item.name,
        'Производитель':      item.manufacturer,
        'Страна':             item.country,
        'Группа':             item.group,
        'Статус':             STATUS_CFG[item.status].label,
        'Остаток (шт.)':      item.stock,
        'Хватит на (дн.)':    Math.round(item.daysOfCover),
        'Продажи/день':       item.avgDailySales,
        'Нужно заказать':     calcRecommendedQty(item, periodDays),
        'Лучшая цена (UZS)':  bestOffer?.priceWithVat ?? '',
        'Дистрибутор':        bestOffer?.distributor.name ?? '',
        'Город дистрибутора': bestOffer?.distributor.city ?? '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Потребность')
    const pharmacyName = selectedPharmacyIds.length === 0
      ? 'все аптеки'
      : selectedPharmacyIds.length === 1
        ? (PHARMACIES.find(p => p.id === selectedPharmacyIds[0])?.name ?? 'аптека')
        : `${selectedPharmacyIds.length} аптеки`
    XLSX.writeFile(wb, `Потребность — ${pharmacyName} — ${new Date().toLocaleDateString('ru')}.xlsx`)
  }

  // ── Render th (reorderable) ────────────────────────────────────────────────
  const thBase: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 2, height: 48,
    background: '#F9FAFB', borderBottom: '1px solid #e5e7eb',
    padding: '0 12px', whiteSpace: 'nowrap', overflow: 'hidden',
  }

  function renderTh(key: ColKey) {
    const isDragOver  = overCol === key && dragColRef.current !== key
    const borderStyle: React.CSSProperties = isDragOver
      ? { borderLeft: '2px solid #3B82F6', borderRight: '1px solid #e5e7eb' }
      : { borderRight: '1px solid #e5e7eb' }
    const dragProps = {
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => handleColDragStart(e, key),
      onDragOver:  (e: React.DragEvent) => handleColDragOver(e, key),
      onDrop:      (e: React.DragEvent) => { e.preventDefault(); handleColDrop(key) },
      onDragEnd:   handleColDragEnd,
    }
    return (
      <th key={key} {...dragProps}
        style={{
          ...thBase, ...borderStyle,
          cursor: 'grab',
          textAlign: key === 'stock' || key === 'sales' || key === 'need' ? 'right' : 'left',
        }}>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500" style={{ paddingRight: 8 }}>
          {COL_LABELS[key]}
        </span>
        <ResizeHandle onMouseDown={e => { e.stopPropagation(); startResize(e, key) }} />
      </th>
    )
  }

  // ── Render td (reorderable cell) ───────────────────────────────────────────
  function renderCell(key: ColKey, item: NeedItem, recQty: number) {
    const cfg    = STATUS_CFG[item.status]
    const isDead = item.status === 'dead'
    const tdBase: React.CSSProperties = { padding: '0 12px', borderRight: '1px solid #f3f4f6' }

    switch (key) {
      case 'status':
        return (
          <td key="status" style={tdBase}>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', cfg.badgeCls)}>
              {cfg.label}
            </span>
          </td>
        )
      case 'stock':
        return (
          <td key="stock" style={{ ...tdBase, textAlign: 'right' }}>
            <span className={cn('text-sm tabular-nums font-medium',
              item.stock === 0 ? 'text-red-500 font-bold' : isDead ? 'text-gray-400' : 'text-gray-700')}>
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
            <span className={cn('text-sm tabular-nums', isDead ? 'text-gray-300' : 'text-gray-600')}>
              {item.avgDailySales.toFixed(1)}
            </span>
          </td>
        )
      case 'need':
        return (
          <td key="need" style={{ ...tdBase, textAlign: 'right' }}>
            {recQty > 0
              ? <span className="text-sm font-semibold tabular-nums text-gray-900">{recQty}</span>
              : <span className="text-sm text-gray-300">—</span>}
          </td>
        )
      default: return null
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white"
      onClick={() => { setGroupOpen(false); setPharmacyOpen(false) }}>

      {/* ── Top controls ──────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">

          {/* Pharmacy multi-select */}
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPharmacyOpen(v => !v)}
              className={cn(
                'flex h-9 w-[240px] items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
                selectedPharmacyIds.length > 0
                  ? 'border-gray-300 bg-gray-50 text-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}>
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="flex-1 truncate text-left">{pharmacyLabel}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform', pharmacyOpen && 'rotate-180')} />
            </button>
            {pharmacyOpen && (
              <div className="absolute left-0 top-10 z-50 w-64 rounded-xl border border-gray-200 bg-white py-1 shadow-lg max-h-72 overflow-y-auto">
                {PHARMACIES.map(ph => {
                  const checked = selectedPharmacyIds.includes(ph.id)
                  return (
                    <label key={ph.id}
                      onClick={() => setSelectedPharmacyIds(prev =>
                        checked ? prev.filter(id => id !== ph.id) : [...prev, ph.id]
                      )}
                      className="flex cursor-pointer w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <div className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300',
                      )}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className={cn('truncate', checked ? 'font-medium text-gray-900' : 'text-gray-700')}>{ph.name}</span>
                    </label>
                  )
                })}
                {selectedPharmacyIds.length > 0 && (
                  <div className="border-t border-gray-100 px-3 py-2">
                    <button onClick={() => setSelectedPharmacyIds([])}
                      className="text-xs text-gray-400 hover:text-gray-600">
                      Сбросить всё
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative h-9 w-52">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Поиск по названию..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-full w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-400" />
          </div>

          {/* Group filter — ml-auto pushes rest to right */}
          <div className="ml-auto relative shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setGroupOpen(v => !v)}
              className={cn(
                'flex h-9 w-[180px] items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
                groupFilter ? 'border-gray-300 text-gray-700' : 'border-gray-200 text-gray-500 hover:border-gray-300',
              )}>
              <span className="flex-1 truncate text-left">{groupFilter ?? 'Группа товаров'}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', groupOpen && 'rotate-180')} />
            </button>
            {groupOpen && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg max-h-64 overflow-y-auto">
                <button onClick={() => { setGroupFilter(null); setGroupOpen(false) }}
                  className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50', !groupFilter ? 'font-medium text-gray-900' : 'text-gray-500')}>
                  Все группы
                </button>
                {GROUPS.map(g => (
                  <button key={g} onClick={() => { setGroupFilter(g); setGroupOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {groupFilter === g && <Check className="h-3.5 w-3.5 shrink-0 text-gray-900" />}
                    <span className={groupFilter === g ? '' : 'ml-5'}>{g}</span>
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Period dropdown */}
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPeriodOpen(v => !v)}
              className={cn(
                'flex h-9 w-[260px] items-center gap-2 rounded-lg border bg-white px-3 text-sm transition-colors',
                periodOpen
                  ? 'border-gray-400 ring-2 ring-gray-900/20'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300',
              )}
            >
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="whitespace-nowrap text-gray-500">Потребность на:</span>
              <span className="flex-1 truncate text-left font-medium text-gray-900">
                {period === 'custom'
                  ? (customFrom && customTo ? `${fmtDate(customFrom)} — ${fmtDate(customTo)}` : 'Свой период')
                  : PERIODS.find(p => p.key === period)!.label}
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', periodOpen && 'rotate-180')} />
            </button>

            {periodOpen && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setPeriodOpen(false)} />
                <div className="absolute left-0 top-10 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="py-1">
                    {PERIODS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => {
                          setPeriod(p.key)
                          if (p.key !== 'custom') setPeriodOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50',
                          period === p.key ? 'text-gray-900' : 'text-gray-600',
                        )}
                      >
                        <div className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                          period === p.key ? 'border-gray-900 bg-gray-900' : 'border-gray-300',
                        )}>
                          {period === p.key && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={period === p.key ? 'font-medium' : ''}>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom date range */}
                  {period === 'custom' && (
                    <div className="border-t border-gray-100 px-3 py-3">
                      <RangeCalendar
                        from={customFrom}
                        to={customTo}
                        onChange={(f, t) => { setCustomFrom(f); setCustomTo(t) }}
                      />
                      <button
                        disabled={!customFrom || !customTo}
                        onClick={() => setPeriodOpen(false)}
                        className="mt-2 h-8 w-full rounded-lg bg-gray-900 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Применить
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Export */}
          <button onClick={handleExport}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700 hover:border-green-700 transition-colors">
            <Download className="h-3.5 w-3.5" />
            Excel
          </button>

        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-4 gap-3">

          {/* 1. Нет в наличии */}
          <div onClick={() => handleKpiClick(['oos'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all',
              isKpiActive(['oos']) ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Нет в наличии</p>
              <InfoTooltip text="Товары с нулевым остатком. Продажи невозможны — каждый день без товара приносит прямые потери выручки." />
            </div>
            <div className="mt-auto flex items-end justify-between gap-1 pt-3">
              <p className={cn('text-2xl font-bold tabular-nums leading-none', kpi.oos.length > 0 ? 'text-red-500' : 'text-gray-900')}>
                {kpi.oos.length} {kpi.oos.length === 1 ? 'товар' : 'товара'}
              </p>
              <p className="text-xs text-gray-500 text-right leading-tight">
                {kpi.oos.length > 0 ? `Потери ${formatCurrency(kpi.lostPerDay * periodDays)} за ${periodDays} дн.` : 'Всё в наличии'}
              </p>
            </div>
          </div>

          {/* 2. Критично */}
          <div onClick={() => handleKpiClick(['critical'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all',
              isKpiActive(['critical']) ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Критично</p>
              <InfoTooltip text="Товары с остатком менее 7 дней. Срочно требуют дозаказа, иначе перейдут в статус «Нет в наличии»." />
            </div>
            <div className="mt-auto flex items-end justify-between gap-1 pt-3">
              <p className={cn('text-2xl font-bold tabular-nums leading-none', kpi.critical.length > 0 ? 'text-amber-500' : 'text-gray-900')}>
                {kpi.critical.length} {kpi.critical.length === 1 ? 'товар' : 'товара'}
              </p>
              <p className="text-xs text-gray-500 text-right leading-tight">Хватит&nbsp;&lt;&nbsp;7 дней</p>
            </div>
          </div>

          {/* 3. Срочный заказ */}
          <div onClick={() => handleKpiClick(['oos', 'critical'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all',
              isKpiActive(['oos', 'critical']) ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Срочный заказ</p>
              <InfoTooltip text="Минимальная сумма заказа для восстановления отсутствующих и критичных позиций на выбранный период." />
            </div>
            <div className="mt-auto flex items-end justify-between gap-1 pt-3">
              <p className={cn('text-2xl font-bold tabular-nums leading-none', kpi.urgentTotal > 0 ? 'text-red-500' : 'text-gray-900')}>
                {formatCurrency(kpi.urgentTotal)}
              </p>
              <p className="text-xs text-gray-500 text-right leading-tight">
                {kpi.urgentCount} поз. · срочные позиции
              </p>
            </div>
          </div>

          {/* 4. Заморожено */}
          <div onClick={() => handleKpiClick(['overstock', 'dead'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all',
              isKpiActive(['overstock', 'dead']) ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Заморожено</p>
              <InfoTooltip text="Капитал, замороженный в товарах с избыточным запасом. Деньги, которые можно высвободить, сократив закупки." />
            </div>
            <div className="mt-auto flex items-end justify-between gap-1 pt-3">
              <p className="text-2xl font-bold tabular-nums leading-none text-blue-500">{formatCurrency(kpi.frozenTotal)}</p>
              <p className="text-xs text-gray-500 text-right leading-tight">{kpi.overstock.length} товаров с избытком</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Table */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

          <div ref={tableContainerRef} className="flex-1 overflow-x-auto overflow-y-auto">
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
                  {/* Checkbox */}
                  <th style={{ ...thBase, padding: 0, textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input type="checkbox" checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked }}
                        onChange={handleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900" />
                    </div>
                  </th>
                  {/* Name */}
                  <th style={{ ...thBase, textAlign: 'left', borderRight: '1px solid #e5e7eb' }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Название</span>
                  </th>
                  {/* Manufacturer */}
                  <th style={{ ...thBase, textAlign: 'left', borderRight: '1px solid #e5e7eb' }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Производитель</span>
                  </th>
                  {/* Reorderable */}
                  {colOrder.map(k => renderTh(k))}
                  {/* AI action header */}
                  <th style={{ ...thBase, position: 'sticky', right: 0, zIndex: 4, padding: 0, borderLeft: '1px solid #e5e7eb' }} />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3 + colOrder.length}>
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-3 rounded-2xl bg-gray-100 p-5">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">Нет позиций по выбранным фильтрам</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(item => {
                  const cfg       = STATUS_CFG[item.status]
                  const isChecked = checkedIds.includes(item.id)
                  const isOpen    = drawerItem?.id === item.id
                  const recQty    = calcRecommendedQty(item, periodDays)

                  return (
                    <tr key={item.id}
                      onClick={() => setDrawerItem(isOpen ? null : item)}
                      className="group cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                      style={{ background: isOpen ? '#F3F4F6' : (cfg.rowBg || undefined) }}>

                      {/* Checkbox */}
                      <td style={{ padding: 0, position: 'relative', borderRight: '1px solid #f3f4f6' }}
                        onClick={e => toggleCheck(item.id, e)}>
                        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.borderColor, borderRadius: '0 2px 2px 0' }} />
                        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input type="checkbox" checked={isChecked} onChange={() => {}}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900" />
                        </div>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '0 12px', overflow: 'hidden', borderRight: '1px solid #f3f4f6' }}>
                        <div style={{ height: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                          <p className={cn('truncate text-sm font-medium', item.status === 'dead' ? 'text-gray-400' : 'text-gray-900')}>
                            {item.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-400">{item.group}</p>
                        </div>
                      </td>

                      {/* Manufacturer + Country */}
                      <td style={{ padding: '0 12px', overflow: 'hidden', borderRight: '1px solid #f3f4f6' }}>
                        <div style={{ height: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                          <p className="truncate text-sm text-gray-700">{item.manufacturer}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-400">{item.country}</p>
                        </div>
                      </td>

                      {/* Reorderable cells */}
                      {colOrder.map(k => renderCell(k, item, recQty))}

                      {/* AI advice sticky right */}
                      <td
                        style={{ position: 'sticky', right: 0, zIndex: 2, padding: '0 10px', borderLeft: '1px solid #f3f4f6', background: isOpen ? '#F3F4F6' : (cfg.rowBg || '#FFFFFF') }}
                        className="transition-colors group-hover:bg-gray-50"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setAiItem(item)}
                          title="AI-рекомендации"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600"
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

          {/* Bulk action bar */}
          {checkedIds.length >= 1 && (
            <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
              <span className="text-sm text-gray-600">
                Выбрано: <span className="font-semibold text-gray-900">{checkedIds.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCheckedIds([])}
                  className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:border-gray-300 transition-colors">
                  Отмена
                </button>
                <button onClick={handleBulkAddToCart}
                  className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-black">
                  <Zap className="h-4 w-4" />
                  Добавить в заказ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer */}
        {drawerItem && (
          <NeedDrawer
            item={drawerItem}
            periodDays={periodDays}
            selectedPharmacyIds={selectedPharmacyIds}
            activeOffer={selectedOfferMap[drawerItem.id] ?? getBestOffer(drawerItem.id)}
            onClose={() => setDrawerItem(null)}
            onAddToCart={handleAddToCart}
            onShowOffers={setOffersModalItem}
          />
        )}
      </div>

      {/* Offers Modal */}
      {offersModalItem && (
        <OffersModal
          item={offersModalItem}
          currentOfferId={selectedOfferMap[offersModalItem.id]?.id ?? null}
          onSelectOffer={offer => setSelectedOfferMap(prev => ({ ...prev, [offersModalItem.id]: offer }))}
          onClose={() => setOffersModalItem(null)}
        />
      )}

      {/* AI Advice Modal */}
      {aiItem && (
        <AIAdviceModal item={aiItem} onClose={() => setAiItem(null)} />
      )}
    </div>
  )
}
