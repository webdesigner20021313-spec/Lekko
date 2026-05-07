import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Search, X, Package, Building2,
  ChevronDown, Check, Zap, TrendingDown, Plus, Download, Star, Calendar,
  Sparkles, ArrowRightLeft, AlertTriangle, ShoppingCart as CartIcon,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import { useToast } from '@/shared/ui-kit/Toaster'
import { mockNeedItems, type NeedItem, type NeedStatus } from '@/products/megaprice/mocks/need.mocks'
import { mockSupplierOffers } from '@/products/megaprice/mocks/purchase.mocks'
import type { SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'

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
      frozenAmount:      (status === 'overstock')
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

// ─── Config (non-translated) ──────────────────────────────────────────────────

const STATUS_STYLE: Record<NeedStatus, { badgeCls: string; borderColor: string; rowBg: string }> = {
  oos:       { badgeCls: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]', borderColor: '#EF4444', rowBg: '#FFF8F8' },
  critical:  { badgeCls: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]', borderColor: '#F59E0B', rowBg: '' },
  normal:    { badgeCls: 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]', borderColor: '#10B981', rowBg: '' },
  overstock: { badgeCls: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD]', borderColor: '#3B82F6', rowBg: '' },
  dead:      { badgeCls: 'bg-[#F3F4F6] text-[#374151] dark:bg-gray-700 dark:text-gray-300',        borderColor: '#9CA3AF', rowBg: '' },
}

const STATUS_ORDER: Record<NeedStatus, number> = { oos: 0, critical: 1, normal: 2, overstock: 3, dead: 4 }

const SCENARIOS: { key: ScenarioKey; filter: (i: NeedItem[]) => NeedItem[] }[] = [
  { key: 'urgent',    filter: i => i.filter(x => x.status === 'oos' || x.status === 'critical') },
  { key: 'oos',       filter: i => i.filter(x => x.status === 'oos') },
  { key: 'overstock', filter: i => i.filter(x => x.status === 'overstock' || x.status === 'dead') },
  { key: 'dead',      filter: i => i.filter(x => x.status === 'dead') },
  { key: 'all',       filter: i => i },
]

const GROUPS = Array.from(new Set(mockNeedItems.map(i => i.group))).sort()

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
  const { t } = useTranslation()
  return <span className="text-sm text-gray-700 tabular-nums dark:text-gray-300">{t('need_days_n', { n: Math.round(days) })}</span>
}

// ─── MiniBarChart ─────────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: number[] }) {
  const { t, i18n } = useTranslation()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartW, setChartW] = useState(296)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setChartW(Math.floor(e[0].contentRect.width)))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const locale = i18n.language === 'uz' ? 'uz-Latn-UZ' : 'ru-RU'
  const MONTHS_SHORT = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (4 + i) % 12
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2025, monthIndex, 1))
    }), [locale]
  )

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
          {MONTHS_SHORT[hoveredIdx]}: {t('need_pcs_n', { n: data[hoveredIdx] })}
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
  const { t } = useTranslation()
  const offers    = getAllOffers(item.id)
  const bestPrice = offers[0]?.priceWithVat ?? 0

  const colHeaders = [
    t('col_distributor'), t('need_col_city'), t('col_price_vat'),
    t('col_price_date'), t('need_col_expiry_date'), t('need_col_bonus'),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="flex w-[760px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-[#111111] dark:border dark:border-gray-700"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{item.manufacturer} · {item.country} · {item.group}</p>
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
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('need_offers_empty')}</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#222222]" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <th className="w-8 px-3 py-2.5" />
                  {colHeaders.map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap">
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">{offer.distributor.lastPriceDate}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{offer.expiryDate}</span>
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
    <div className="flex h-full shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]"
      style={{ width: DRAWER_W, minWidth: DRAWER_W }}>

      <div className="shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">{item.name}</p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{item.manufacturer} · {item.country} · {item.group}</p>
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
            <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-[#333333] dark:bg-gray-800">
              <p className="text-xs font-normal text-gray-400 dark:text-gray-500">{label}</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100" style={color ? { color } : undefined}>{value}</p>
            </div>
          ))}
        </div>

        {item.status === 'oos' && item.lostRevenuePerDay > 0 && (
          <div className="mx-4 mt-4 rounded-xl bg-gray-900 p-4 dark:bg-gray-800">
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
          <div className="mx-4 mt-4 rounded-xl bg-gray-900 p-4 dark:bg-gray-800">
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
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_ph_col_pharmacy')}</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_col_stock')}</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_ph_col_sales_month')}</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((ph, idx) => {
                  const phStyle = STATUS_STYLE[ph.status]
                  return (
                    <tr key={ph.id}
                      className={cn('border-b border-gray-100 last:border-0 dark:border-[#333333]', idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'bg-white dark:bg-[#111111]')}>
                      <td className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-300" style={{ maxWidth: 130 }}>{ph.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <span className={cn('text-xs font-semibold', ph.stock === 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300')}>
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
                  className="h-8 w-16 rounded-lg border border-gray-200 bg-white text-center text-sm font-semibold tabular-nums outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-400" />
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
                  <span className="text-gray-500 dark:text-gray-400">{bestOffer.distributor.city}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span className="font-semibold text-gray-700 tabular-nums dark:text-gray-300">{formatCurrency(bestOffer.priceWithVat)}/шт.</span>
                  {OFFER_COUNT[item.id] > 1 && (
                    <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
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
                  : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600',
              )}>
              <Plus className="h-4 w-4" />
              {t('need_add_to_cart_btn')}
            </button>
            {!bestOffer && (
              <p className="mt-2 text-center text-xs text-red-500 dark:text-red-400">{t('need_no_offers_warning')}</p>
            )}
          </>
        ) : (
          <p className="py-1 text-center text-xs text-gray-400 dark:text-gray-500">{t('need_no_order')}</p>
        )}
      </div>
    </div>
  )
}

// ─── AI Recommendations ───────────────────────────────────────────────────────

function seededNum(seed: string, idx: number, min: number, max: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) ^ idx * 2654435761
  return min + Math.abs(h) % (max - min + 1)
}

interface BranchData {
  name:        string
  stock:       number
  dailySales:  number
  daysOfCover: number
  expiryDays:  number
}

function shortBranch(name: string) { return name.replace(/^Филиал №\d+\s*/, '') }

const BRANCH_NAMES = [
  'Ул. Навои, 14',
  'Пр. Мустакиллик, 32',
  'Ул. Амира Темура, 8',
  'Ул. Бунёдкор, 21',
]

function buildBranchData(item: NeedItem): BranchData[] {
  const seed    = item.id
  const count   = 3 + (seededNum(seed, 99, 0, 1))
  const branches: BranchData[] = []
  let remainStock = item.stock
  let remainSales = item.avgDailySales
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1
    const stockShare = isLast ? remainStock : Math.round(remainStock * seededNum(seed, i * 10, 15, 55) / 100)
    const salesShare = isLast ? Math.max(0, remainSales) : parseFloat((remainSales * seededNum(seed, i * 10 + 1, 5, 50) / 100).toFixed(1))
    let effectiveSales = salesShare
    if ((item.status === 'dead' || item.status === 'overstock') && i === count - 1) effectiveSales = 0
    const daysOfCover = effectiveSales > 0 ? Math.round(stockShare / effectiveSales) : 999
    const expiryDays  = seededNum(seed, i * 10 + 5, 20, 180)
    branches.push({ name: BRANCH_NAMES[i], stock: Math.max(0, stockShare), dailySales: parseFloat(effectiveSales.toFixed(1)), daysOfCover, expiryDays })
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
  title:        string
  headline:     string
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
    const tableRows = noSalesBranches.map(b => [shortBranch(b.name), '0 шт./день', `${fmt(b.stock)} шт.`] as [string, string, string])
    const minExp = Math.min(...noSalesBranches.map(b => b.expiryDays))
    const analysisParts = noSalesBranches.some(b => b.expiryDays < 90)
      ? [`${fmt(transferQty)} шт. стоят без продаж, а срок годности через ${minExp} дн. Не перевезти сейчас — товар спишется.`]
      : [`${fmt(transferQty)} шт. стоят без движения — деньги заморожены. В других точках этот товар уходит хорошо.`]
    const steps: string[] = []
    noSalesBranches.forEach(b => { steps.push(`Забрать ${fmt(b.stock)} шт. из ${shortBranch(b.name)}`) })
    const totalTargetSales = safeTargets.reduce((s, b) => s + b.dailySales, 0)
    safeTargets.forEach(b => {
      const portion = totalTargetSales > 0 ? Math.round(transferQty * (b.dailySales / totalTargetSales)) : perBranch
      steps.push(`Везти ${fmt(portion)} шт. в ${shortBranch(b.name)}`)
    })
    if (riskyBranch) steps.push(`В ${shortBranch(riskyBranch.name)} не везти — там запас на ${riskyBranch.daysOfCover} дн., не успеют продать`)
    recs.push({ id: 'transfer', severity: 'blue', icon: <ArrowRightLeft className="h-4 w-4" />, badgeLabel: 'Нет движения', title: 'Товар не продаётся', headline: `${fmt(transferQty)} шт. простаивают в ${noSalesBranches.length > 1 ? noSalesBranches.length + ' филиалах' : shortBranch(noSalesBranches[0].name)}`, tableHeaders: ['Филиал', 'Продаж/день', 'Остаток'], tableRows, analysis: analysisParts.join(' '), steps })
  }

  if (expiryRiskBranches.length > 0) {
    const atRiskQty  = expiryRiskBranches.reduce((s, b) => s + b.stock, 0)
    const atRiskLoss = atRiskQty * item.costPrice
    const minExpiry  = Math.min(...expiryRiskBranches.map(r => r.expiryDays))
    const fastBranches = branches.filter(b => b.dailySales >= 1 && !expiryRiskBranches.includes(b)).sort((a, b) => b.dailySales - a.dailySales).slice(0, 2)
    const canSellInTime = fastBranches.reduce((s, b) => s + Math.round(b.dailySales * minExpiry), 0)
    const tableRows = expiryRiskBranches.map(b => [shortBranch(b.name), `${b.expiryDays} дн.`, `${fmt(b.stock)} шт.`] as [string, string, string])
    const totalCanSell = expiryRiskBranches.reduce((s, b) => s + Math.round(b.dailySales * b.expiryDays), 0)
    const totalWillExpire = Math.max(0, atRiskQty - totalCanSell)
    const expiryAnalysis = totalWillExpire > 0
      ? `При текущем темпе продадут ${fmt(totalCanSell)} шт. — остальные ${fmt(totalWillExpire)} шт. уйдут в списание. Действовать нужно сейчас.`
      : `Продать должны успеть, но запас на пределе. Если спрос чуть упадёт — часть товара просрочится.`
    const steps: string[] = []
    if (fastBranches.length > 0 && canSellInTime >= atRiskQty * 0.6) {
      const totalFastSales = fastBranches.reduce((s, b) => s + b.dailySales, 0)
      fastBranches.forEach(b => {
        const canTake = totalFastSales > 0 ? Math.round(atRiskQty * (b.dailySales / totalFastSales)) : Math.round(atRiskQty / fastBranches.length)
        steps.push(`Срочно перевезти ${fmt(canTake)} шт. в ${shortBranch(b.name)}`)
      })
    } else {
      steps.push(`Предложить ~${fmt(Math.round(atRiskQty * 0.5))} шт. оптом соседней аптеке`)
      steps.push(`Сделать скидку 20–25% — ускорить продажи пока не поздно`)
    }
    steps.push(`Новый заказ не делать до полной продажи текущего остатка`)
    recs.push({ id: 'expiry', severity: 'orange', icon: <AlertTriangle className="h-4 w-4" />, badgeLabel: 'Срок годности', title: 'Срок годности истекает', headline: `через ${minExpiry} дн. — ${fmt(atRiskQty)} шт.`, tableHeaders: ['Филиал', 'До просрочки', 'Остаток'], tableRows, analysis: expiryAnalysis, loss: `${fmt(atRiskLoss)} сум`, steps })
  }

  if (item.status === 'dead' || (networkDailySales < 0.5 && item.stock > 0)) {
    const minExpiry    = Math.min(...branches.map(b => b.expiryDays))
    const canSell      = networkDailySales > 0 ? Math.round(networkDailySales * minExpiry) : 0
    const willExpire   = Math.max(0, item.stock - canSell)
    const expireLoss   = willExpire * item.costPrice
    const monthsToSell = networkDailySales > 0 ? (item.stock / networkDailySales / 30).toFixed(1) : '∞'
    const tableRows = branches.map(b => [shortBranch(b.name), `${b.dailySales.toFixed(1)} шт./день`, b.daysOfCover < 999 ? `${b.daysOfCover} дн.` : '—'] as [string, string, string])
    const analysis = networkDailySales > 0
      ? `Весь остаток уйдёт за ~${monthsToSell} мес., а срок истекает через ${minExpiry} дн.${willExpire > 0 ? ` ${fmt(willExpire)} шт. просрочатся.` : ''}`
      : `Ни в одном филиале продаж нет. Весь остаток — ${fmt(item.stock)} шт. — просрочится через ${minExpiry} дн.`
    const steps = [`Предложить ${fmt(Math.round(item.stock * 0.4))}–${fmt(Math.round(item.stock * 0.5))} шт. оптом соседней аптеке`, `Сделать скидку 15–25% — нужно ускорить продажи`, `Исключить из плана закупок до роста спроса`]
    recs.push({ id: 'dead_network', severity: 'red', icon: <TrendingDown className="h-4 w-4" />, badgeLabel: 'Не продаётся', title: 'Слабые продажи по всей сети', headline: `${networkDailySales.toFixed(1)} шт./день — реализация займёт ~${monthsToSell} мес.`, tableHeaders: ['Филиал', 'Продаж/день', 'Запас'], tableRows, analysis, loss: willExpire > 0 ? `${fmt(expireLoss)} сум` : undefined, steps })
  }

  if (item.status === 'oos' || item.status === 'critical') {
    const surplus = branches.filter(b => b.daysOfCover > 60).sort((a, b) => b.stock - a.stock)
    const tableRows = (surplus.length > 0 ? surplus : branches).map(b => [shortBranch(b.name), b.daysOfCover < 999 ? `${b.daysOfCover} дн.` : '—', `${fmt(b.stock)} шт.`] as [string, string, string])
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
      surplus.forEach(b => { steps.push(`Перевезти ${fmt(Math.round(b.stock * 0.4))} шт. из ${shortBranch(b.name)}`) })
    } else {
      steps.push(`Сделать срочный заказ у поставщика — ${fmt(item.recommendedQty)} шт.`)
    }
    steps.push(`Добавить в ближайший заказ поставщику`)
    recs.push({ id: 'oos', severity: 'red', icon: <CartIcon className="h-4 w-4" />, badgeLabel: item.status === 'oos' ? 'Нет в наличии' : 'Критично мало', title: item.status === 'oos' ? 'Товара нет в наличии' : 'Запас на исходе', headline: item.status === 'oos' ? `потери ${fmt(item.lostRevenuePerDay)} сум каждый день` : `хватит на ${Math.round(item.daysOfCover)} дн. при ${item.avgDailySales.toFixed(1)} шт./день`, tableHeaders: surplus.length > 0 ? ['Филиал (излишки)', 'Запас', 'Остаток'] : ['Филиал', 'Запас', 'Остаток'], tableRows, analysis, steps })
  }

  return recs
}

const SEV_STYLE = {
  red:    { bar: 'bg-red-400',    badge: 'bg-red-50 text-red-500 dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]',           metric: 'text-red-500'    },
  orange: { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-600 dark:bg-[#78350F]/40 dark:text-[#FCD34D]',       metric: 'text-amber-600'  },
  blue:   { bar: 'bg-indigo-400', badge: 'bg-indigo-50 text-indigo-600 dark:bg-[#312E81]/40 dark:text-[#C4B5FD]',     metric: 'text-indigo-600' },
} as const

function AIAdviceModal({ item, onClose }: { item: NeedItem; onClose: () => void }) {
  const { t } = useTranslation()
  const recs = useMemo(() => getAIRecommendations(item), [item])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative flex w-full max-w-[460px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#111111] dark:border dark:border-gray-700"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#333333]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-700">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 leading-tight dark:text-gray-100">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{item.manufacturer} · {item.country}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {recs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('need_ai_ok_title')}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('need_ai_ok_desc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#333333]">
              {recs.map((rec) => {
                const sev = SEV_STYLE[rec.severity]
                return (
                  <div key={rec.id} className="flex">
                    <div className={cn('w-[3px] shrink-0', sev.bar)} />
                    <div className="flex-1 min-w-0 px-4 pt-4 pb-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[18px] font-bold text-gray-900 leading-snug dark:text-gray-100">{rec.title}</p>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium leading-none', sev.badge)}>
                            {rec.icon}
                            {rec.badgeLabel}
                          </span>
                        </div>
                      </div>
                      {rec.analysis && (
                        <p className="text-sm text-gray-500 leading-relaxed mb-3 dark:text-gray-400">
                          {rec.analysis}
                          {rec.loss && (
                            <> <span className="text-red-500">{t('need_ai_losses_label')} {rec.loss}.</span></>
                          )}
                        </p>
                      )}
                      {rec.tableRows && rec.tableRows.length > 0 && (
                        <div className="mb-4 overflow-hidden rounded-lg border border-gray-100 dark:border-[#333333]">
                          {rec.tableHeaders && (
                            <div className="grid grid-cols-3 bg-gray-50 px-3 py-1.5 border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                              {rec.tableHeaders.map((h, hi) => (
                                <p key={hi} className={cn('text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500', hi > 0 ? 'text-right' : 'text-left')}>{h}</p>
                              ))}
                            </div>
                          )}
                          {rec.tableRows.map((row, ri) => (
                            <div key={ri} className={cn('grid grid-cols-3 px-3 py-2 bg-white dark:bg-[#111111]', ri < rec.tableRows!.length - 1 && 'border-b border-gray-100 dark:border-[#333333]')}>
                              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{row[0]}</p>
                              <p className="text-right text-xs text-gray-500 dark:text-gray-400">{row[1]}</p>
                              <p className="text-right text-xs font-semibold text-gray-900 dark:text-gray-100">{row[2]}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-900 mb-2.5 dark:text-gray-300">{t('need_ai_steps_title')}</p>
                        <ul className="space-y-2">
                          {rec.steps.map((step, si) => (
                            <li key={si} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold leading-none text-white">{si + 1}</span>
                              <span className="text-sm text-gray-700 leading-snug dark:text-gray-300">{step}</span>
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

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 dark:border-[#333333] dark:bg-[#111111]">
          <button onClick={onClose} className="h-10 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition-all duration-200 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600">
            {t('need_ai_ok_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RangeCalendar ───────────────────────────────────────────────────────────

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
  const { t, i18n } = useTranslation()
  const today    = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())
  const [hover, setHover] = useState('')

  const locale = i18n.language === 'uz' ? 'uz-Latn-UZ' : 'ru-RU'

  const MONTHS = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const s = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2025, i, 1))
      return s.charAt(0).toUpperCase() + s.slice(1)
    }), [locale]
  )

  const DAYS = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const s = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2025, 0, 6 + i))
      return s.charAt(0).toUpperCase() + s.slice(1)
    }), [locale]
  )

  const prevM = () => { if (vm === 0) { setVy(y => y-1); setVm(11) } else setVm(m => m-1) }
  const nextM = () => { if (vm === 11) { setVy(y => y+1); setVm(0)  } else setVm(m => m+1) }

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
    if (!from || (from && to)) onChange(iso, '')
    else if (iso >= from) onChange(from, iso)
    else onChange(iso, from)
  }

  const todayISO = toISO(today)

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={prevM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
        </button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{MONTHS[vm]} {vy}</span>
        <button onClick={nextM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500">{d}</div>
        ))}
      </div>
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
            <button key={iso}
              onClick={() => handleClick(date)}
              onMouseEnter={() => { if (from && !to) setHover(iso) }}
              onMouseLeave={() => setHover('')}
              className={cn(
                'h-7 w-full text-xs transition-colors',
                (isF || isT) ? 'rounded-full bg-gray-900 font-semibold text-white dark:bg-blue-600'
                  : inR ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  : cn('rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700', isTod && 'font-bold'),
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
        {!from ? t('need_cal_pick_start') : !to ? t('need_cal_pick_end') : `${fmtDate(from)} — ${fmtDate(to)}`}
      </p>
    </div>
  )
}

// ─── NeedPage ─────────────────────────────────────────────────────────────────

export function NeedPage() {
  const { t } = useTranslation()
  const { addItem } = usePurchaseCart()
  const { toast } = useToast()

  const [selectedPharmacyIds, setSelectedPharmacyIds] = useState<string[]>([])
  const [pharmacyOpen, setPharmacyOpen]               = useState(false)

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

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(900)
  useEffect(() => {
    if (!tableContainerRef.current) return
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width))
    ro.observe(tableContainerRef.current)
    return () => ro.disconnect()
  }, [])

  const [colWidths, setColWidths] = useState<ColWidths>(INIT_WIDTHS)

  function startResize(e: React.MouseEvent, key: ColKey) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startW = colWidths[key]
    function onMove(ev: MouseEvent) { setColWidths(prev => ({ ...prev, [key]: Math.max(60, startW + ev.clientX - startX) })) }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = '' }
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }

  const [colOrder, setColOrder] = useState<ColKey[]>(DEFAULT_ORDER)
  const dragColRef = useRef<ColKey | null>(null)
  const [overCol, setOverCol]   = useState<ColKey | null>(null)

  function handleColDragStart(e: React.DragEvent, key: ColKey) { dragColRef.current = key; e.dataTransfer.effectAllowed = 'move' }
  function handleColDragOver(e: React.DragEvent, key: ColKey) { e.preventDefault(); if (overCol !== key) setOverCol(key) }
  function handleColDrop(key: ColKey) {
    const from = dragColRef.current
    if (!from || from === key) { dragColRef.current = null; setOverCol(null); return }
    const next = [...colOrder]; const fi = next.indexOf(from), ti = next.indexOf(key)
    next.splice(fi, 1); next.splice(ti, 0, from)
    setColOrder(next); dragColRef.current = null; setOverCol(null)
  }
  function handleColDragEnd() { dragColRef.current = null; setOverCol(null) }

  const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
    { key: '7d',     label: t('need_period_7d'),     days: 7   },
    { key: '30d',    label: t('need_period_30d'),    days: 30  },
    { key: '90d',    label: t('need_period_90d'),    days: 90  },
    { key: '1y',     label: t('need_period_1y'),     days: 365 },
    { key: 'custom', label: t('need_period_custom'), days: 30  },
  ]

  function getColLabel(key: ColKey): string {
    switch (key) {
      case 'status': return t('need_col_status')
      case 'stock':  return t('need_col_stock')
      case 'doc':    return t('need_col_doc')
      case 'sales':  return t('need_col_sales')
      case 'need':   return t('need_col_need')
    }
  }

  const periodDays = period === 'custom'
    ? (customFrom && customTo
        ? Math.max(1, Math.round((new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86_400_000))
        : 30)
    : PERIODS.find(p => p.key === period)!.days

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

  const pharmacyLabel = selectedPharmacyIds.length === 0
    ? t('need_all_pharmacies', { n: PHARMACIES.length })
    : selectedPharmacyIds.length === 1
      ? (PHARMACIES.find(ph => ph.id === selectedPharmacyIds[0])?.name ?? t('need_ph_col_pharmacy'))
      : t('need_pharmacies_count', { n: selectedPharmacyIds.length })

  function handleKpiClick(statuses: NeedStatus[]) {
    const isActive = statuses.length === statusFilter.length && statuses.every(s => statusFilter.includes(s))
    setStatusFilter(isActive ? [] : statuses)
  }
  function isKpiActive(statuses: NeedStatus[]) {
    return statuses.length === statusFilter.length && statuses.every(s => statusFilter.includes(s))
  }

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
        title: t('need_toast_added_title'),
        description: t('need_toast_added_desc', { name: item.name, n: qty }),
        variant: 'success',
      })
    }
    return true
  }, [addItem, selectedOfferMap, toast, t])

  function handleBulkAddToCart() {
    const selected = filtered.filter(i => checkedIds.includes(i.id))
    let added = 0
    selected.forEach(item => {
      const qty = calcRecommendedQty(item, periodDays)
      if (qty > 0 && handleAddToCart(item, qty, { silent: true })) added++
    })
    setCheckedIds([])
    if (added > 0) {
      const desc = added === 1
        ? t('need_toast_bulk_1', { n: added })
        : added < 5
          ? t('need_toast_bulk_few', { n: added })
          : t('need_toast_bulk_many', { n: added })
      toast({ title: t('need_toast_added_title'), description: desc, variant: 'success' })
    } else {
      toast({ title: t('need_toast_nothing_title'), description: t('need_toast_nothing_desc'), variant: 'warning' })
    }
  }

  function handleExport() {
    const rows = filtered.map(item => {
      const bestOffer = getBestOffer(item.id)
      return {
        [t('need_excel_name')]:       item.name,
        [t('need_excel_manufacturer')]: item.manufacturer,
        [t('need_excel_country')]:    item.country,
        [t('need_excel_group')]:      item.group,
        [t('need_excel_status')]:     t(`need_status_${item.status}`),
        [t('need_excel_stock')]:      item.stock,
        [t('need_excel_cover')]:      Math.round(item.daysOfCover),
        [t('need_excel_sales')]:      item.avgDailySales,
        [t('need_excel_need')]:       calcRecommendedQty(item, periodDays),
        [t('need_excel_price')]:      bestOffer?.priceWithVat ?? '',
        [t('need_excel_dist')]:       bestOffer?.distributor.name ?? '',
        [t('need_excel_dist_city')]:  bestOffer?.distributor.city ?? '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t('need_excel_sheet'))
    const pharmacyName = selectedPharmacyIds.length === 0
      ? t('need_excel_all_ph')
      : selectedPharmacyIds.length === 1
        ? (PHARMACIES.find(p => p.id === selectedPharmacyIds[0])?.name ?? t('need_excel_one_ph'))
        : t('need_excel_n_ph', { n: selectedPharmacyIds.length })
    XLSX.writeFile(wb, `${t('need_excel_sheet')} — ${pharmacyName} — ${new Date().toLocaleDateString('ru')}.xlsx`)
  }

  const thBase: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 2, height: 48,
    background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)',
    padding: '0 12px', whiteSpace: 'nowrap', overflow: 'hidden',
  }

  function renderTh(key: ColKey) {
    const isDragOver  = overCol === key && dragColRef.current !== key
    const borderStyle: React.CSSProperties = isDragOver
      ? { borderLeft: '2px solid #3B82F6', borderRight: '1px solid var(--table-border)' }
      : { borderRight: '1px solid var(--table-border)' }
    const dragProps = {
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => handleColDragStart(e, key),
      onDragOver:  (e: React.DragEvent) => handleColDragOver(e, key),
      onDrop:      (e: React.DragEvent) => { e.preventDefault(); handleColDrop(key) },
      onDragEnd:   handleColDragEnd,
    }
    return (
      <th key={key} {...dragProps}
        style={{ ...thBase, ...borderStyle, cursor: 'grab', textAlign: key === 'stock' || key === 'sales' || key === 'need' ? 'right' : 'left' }}>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500" style={{ paddingRight: 8 }}>
          {getColLabel(key)}
        </span>
        <ResizeHandle onMouseDown={e => { e.stopPropagation(); startResize(e, key) }} />
      </th>
    )
  }

  function renderCell(key: ColKey, item: NeedItem, recQty: number) {
    const cfg    = STATUS_STYLE[item.status]
    const isDead = item.status === 'dead'
    const tdBase: React.CSSProperties = { padding: '0 12px', borderRight: '1px solid var(--table-cell-border)' }

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
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]"
      onClick={() => { setGroupOpen(false); setPharmacyOpen(false) }}>

      {/* Top controls */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center gap-3">

          {/* Pharmacy multi-select */}
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPharmacyOpen(v => !v)}
              className={cn(
                'flex h-9 w-[240px] items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
                selectedPharmacyIds.length > 0
                  ? 'border-gray-300 bg-gray-50 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600',
              )}>
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="flex-1 truncate text-left">{pharmacyLabel}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform', pharmacyOpen && 'rotate-180')} />
            </button>
            {pharmacyOpen && (
              <div className="absolute left-0 top-10 z-50 w-64 rounded-xl border border-gray-200 bg-white py-1 shadow-lg max-h-72 overflow-y-auto dark:border-gray-700 dark:bg-[#111111]">
                {PHARMACIES.map(ph => {
                  const checked = selectedPharmacyIds.includes(ph.id)
                  return (
                    <label key={ph.id}
                      onClick={() => setSelectedPharmacyIds(prev =>
                        checked ? prev.filter(id => id !== ph.id) : [...prev, ph.id]
                      )}
                      className="flex cursor-pointer w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors', checked ? 'border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 dark:border-gray-600')}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className={cn('truncate', checked ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300')}>{ph.name}</span>
                    </label>
                  )
                })}
                {selectedPharmacyIds.length > 0 && (
                  <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
                    <button onClick={() => setSelectedPharmacyIds([])} className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                      {t('filter_reset_all')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative h-9 w-52">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder={t('need_search_ph')} value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-full w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-400 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500" />
          </div>

          {/* Group filter */}
          <div className="ml-auto relative shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setGroupOpen(v => !v)}
              className={cn(
                'flex h-9 w-[180px] items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
                groupFilter
                  ? 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600',
              )}>
              <span className="flex-1 truncate text-left">{groupFilter ?? t('need_group_placeholder')}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', groupOpen && 'rotate-180')} />
            </button>
            {groupOpen && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg max-h-64 overflow-y-auto dark:border-gray-700 dark:bg-[#111111]">
                <button onClick={() => { setGroupFilter(null); setGroupOpen(false) }}
                  className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800', !groupFilter ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400')}>
                  {t('need_group_all')}
                </button>
                {GROUPS.map(g => (
                  <button key={g} onClick={() => { setGroupFilter(g); setGroupOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                    {groupFilter === g && <Check className="h-3.5 w-3.5 shrink-0 text-gray-900 dark:text-gray-100" />}
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
                'flex h-9 w-[260px] items-center gap-2 rounded-lg border bg-white px-3 text-sm transition-colors dark:bg-[#111111]',
                periodOpen
                  ? 'border-gray-400 ring-2 ring-gray-900/20 dark:border-gray-500'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600',
              )}
            >
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">{t('need_period_for')}</span>
              <span className="flex-1 truncate text-left font-medium text-gray-900 dark:text-gray-100">
                {period === 'custom'
                  ? (customFrom && customTo ? `${fmtDate(customFrom)} — ${fmtDate(customTo)}` : t('need_period_custom'))
                  : PERIODS.find(p => p.key === period)!.label}
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', periodOpen && 'rotate-180')} />
            </button>

            {periodOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPeriodOpen(false)} />
                <div className="absolute left-0 top-10 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#111111]">
                  <div className="py-1">
                    {PERIODS.map(p => (
                      <button key={p.key}
                        onClick={() => { setPeriod(p.key); if (p.key !== 'custom') setPeriodOpen(false) }}
                        className={cn('flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800', period === p.key ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400')}>
                        <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors', period === p.key ? 'border-gray-900 bg-gray-900 dark:border-blue-500 dark:bg-blue-600' : 'border-gray-300 dark:border-gray-600')}>
                          {period === p.key && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={period === p.key ? 'font-medium' : ''}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                  {period === 'custom' && (
                    <div className="border-t border-gray-100 px-3 py-3 dark:border-[#333333]">
                      <RangeCalendar from={customFrom} to={customTo} onChange={(f, t) => { setCustomFrom(f); setCustomTo(t) }} />
                      <button
                        disabled={!customFrom || !customTo}
                        onClick={() => setPeriodOpen(false)}
                        className="mt-2 h-8 w-full rounded-lg bg-gray-900 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t('need_period_apply')}
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

      {/* KPI Cards */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-3">

          <div onClick={() => handleKpiClick(['oos'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all dark:bg-gray-800',
              isKpiActive(['oos']) ? 'border-gray-900 ring-1 ring-gray-900 dark:border-blue-400 dark:ring-blue-400' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_kpi_oos_title')}</p>
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

          <div onClick={() => handleKpiClick(['critical'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all dark:bg-gray-800',
              isKpiActive(['critical']) ? 'border-gray-900 ring-1 ring-gray-900 dark:border-blue-400 dark:ring-blue-400' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_kpi_critical_title')}</p>
              <InfoTooltip text={t('need_kpi_critical_tooltip')} />
            </div>
            <div className="mt-auto flex items-end justify-between gap-1 pt-3">
              <p className={cn('text-2xl font-bold tabular-nums leading-none', kpi.critical.length > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-gray-100')}>
                {kpi.critical.length === 1 ? t('need_kpi_count_1', { n: kpi.critical.length }) : t('need_kpi_count_many', { n: kpi.critical.length })}
              </p>
              <p className="text-xs text-gray-500 text-right leading-tight dark:text-gray-400">{t('need_kpi_critical_sub')}</p>
            </div>
          </div>

          <div onClick={() => handleKpiClick(['oos', 'critical'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all dark:bg-gray-800',
              isKpiActive(['oos', 'critical']) ? 'border-gray-900 ring-1 ring-gray-900 dark:border-blue-400 dark:ring-blue-400' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_kpi_urgent_title')}</p>
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

          <div onClick={() => handleKpiClick(['overstock', 'dead'])}
            className={cn('flex flex-col rounded-xl border bg-white p-4 cursor-pointer transition-all dark:bg-gray-800',
              isKpiActive(['overstock', 'dead']) ? 'border-gray-900 ring-1 ring-gray-900 dark:border-blue-400 dark:ring-blue-400' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600')}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('need_kpi_frozen_title')}</p>
              <InfoTooltip text={t('need_kpi_frozen_tooltip')} />
            </div>
            <div className="mt-auto flex items-end justify-between gap-1 pt-3">
              <p className="text-2xl font-bold tabular-nums leading-none text-blue-500">{formatCurrency(kpi.frozenTotal)}</p>
              <p className="text-xs text-gray-500 text-right leading-tight dark:text-gray-400">{t('need_kpi_frozen_sub', { n: kpi.overstock.length })}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

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
                  <th style={{ ...thBase, padding: 0, textAlign: 'center', borderRight: '1px solid var(--table-border)' }}>
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input type="checkbox" checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked }}
                        onChange={handleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900" />
                    </div>
                  </th>
                  <th style={{ ...thBase, textAlign: 'left', borderRight: '1px solid var(--table-border)' }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('need_th_name')}</span>
                  </th>
                  <th style={{ ...thBase, textAlign: 'left', borderRight: '1px solid var(--table-border)' }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('filter_manufacturer')}</span>
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
                        <div className="mb-3 rounded-2xl bg-gray-100 p-5 dark:bg-gray-800">
                          <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t('need_empty_filtered')}</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(item => {
                  const cfg       = STATUS_STYLE[item.status]
                  const isChecked = checkedIds.includes(item.id)
                  const isOpen    = drawerItem?.id === item.id
                  const recQty    = calcRecommendedQty(item, periodDays)

                  return (
                    <tr key={item.id}
                      onClick={() => setDrawerItem(isOpen ? null : item)}
                      className="group cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-[#333333] dark:hover:bg-gray-800"
                      style={{ background: isOpen ? 'var(--need-open-row-bg)' : (cfg.rowBg ? 'var(--need-oos-row-bg)' : undefined) }}>

                      <td style={{ padding: 0, position: 'relative', borderRight: '1px solid var(--table-cell-border)' }}
                        onClick={e => toggleCheck(item.id, e)}>
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
                          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{item.group}</p>
                        </div>
                      </td>

                      <td style={{ padding: '0 12px', overflow: 'hidden', borderRight: '1px solid var(--table-cell-border)' }}>
                        <div style={{ height: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                          <p className="truncate text-sm text-gray-700 dark:text-gray-300">{item.manufacturer}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{item.country}</p>
                        </div>
                      </td>

                      {colOrder.map(k => renderCell(k, item, recQty))}

                      <td
                        style={{ position: 'sticky', right: 0, zIndex: 2, padding: '0 10px', borderLeft: '1px solid var(--table-cell-border)', background: isOpen ? 'var(--need-open-row-bg)' : (cfg.rowBg ? 'var(--need-oos-row-bg)' : 'var(--table-row-bg)') }}
                        className="transition-colors group-hover:bg-gray-50 dark:group-hover:bg-gray-800"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setAiItem(item)}
                          title="AI"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20 dark:hover:text-violet-400"
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

          {checkedIds.length >= 1 && (
            <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-[#111111]">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('need_bulk_selected')} <span className="font-semibold text-gray-900 dark:text-gray-100">{checkedIds.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCheckedIds([])}
                  className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:border-gray-300 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600">
                  {t('need_bulk_cancel')}
                </button>
                <button onClick={handleBulkAddToCart}
                  className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]">
                  <Zap className="h-4 w-4" />
                  {t('need_bulk_add_order')}
                </button>
              </div>
            </div>
          )}
        </div>

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

      {offersModalItem && (
        <OffersModal
          item={offersModalItem}
          currentOfferId={selectedOfferMap[offersModalItem.id]?.id ?? null}
          onSelectOffer={offer => setSelectedOfferMap(prev => ({ ...prev, [offersModalItem.id]: offer }))}
          onClose={() => setOffersModalItem(null)}
        />
      )}

      {aiItem && (
        <AIAdviceModal item={aiItem} onClose={() => setAiItem(null)} />
      )}
    </div>
  )
}
