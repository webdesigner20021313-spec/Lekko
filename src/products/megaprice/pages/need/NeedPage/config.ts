import { mockNeedItems, type NeedItem, type NeedStatus } from '@/products/megaprice/mocks/need.mocks'
import { mockSupplierOffers } from '@/products/megaprice/mocks/purchase.mocks'
import type { ColKey, ColWidths, ScenarioKey } from './types'

// Сколько офферов у каждого drugId — нужен для лейбла «ещё N предложений».
export const OFFER_COUNT: Record<string, number> = (() => {
  const m: Record<string, number> = {}
  mockSupplierOffers.forEach(o => { m[o.medicineId] = (m[o.medicineId] ?? 0) + 1 })
  return m
})()

export const PHARMACIES: { id: string; name: string }[] = [
  { id: 'ph1', name: 'Дорилар дунёси (Мирабад)' },
  { id: 'ph2', name: 'Шифо (Юнусабад)' },
  { id: 'ph3', name: 'Здоровье (Чиланзар)' },
  { id: 'ph4', name: 'Hayot Dori (Самарканд)' },
  { id: 'ph5', name: 'Nasiba Dori (Фергана)' },
  { id: 'ph6', name: 'Дорихона (Ташкент)' },
  { id: 'ph7', name: 'Медикус (Андижан)' },
]

export const STATUS_STYLE: Record<NeedStatus, { badgeCls: string; borderColor: string; rowBg: string }> = {
  oos:       { badgeCls: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]', borderColor: '#EF4444', rowBg: '#FFF8F8' },
  critical:  { badgeCls: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]', borderColor: '#F59E0B', rowBg: '' },
  normal:    { badgeCls: 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]', borderColor: '#10B981', rowBg: '' },
  overstock: { badgeCls: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD]', borderColor: '#3B82F6', rowBg: '' },
  dead:      { badgeCls: 'bg-[#F3F4F6] text-[#374151] dark:bg-gray-700 dark:text-gray-300',        borderColor: '#9CA3AF', rowBg: '' },
}

export const STATUS_ORDER: Record<NeedStatus, number> = { oos: 0, critical: 1, normal: 2, overstock: 3, dead: 4 }

export const SCENARIOS: { key: ScenarioKey; filter: (i: NeedItem[]) => NeedItem[] }[] = [
  { key: 'urgent',    filter: i => i.filter(x => x.status === 'oos' || x.status === 'critical') },
  { key: 'oos',       filter: i => i.filter(x => x.status === 'oos') },
  { key: 'overstock', filter: i => i.filter(x => x.status === 'overstock' || x.status === 'dead') },
  { key: 'dead',      filter: i => i.filter(x => x.status === 'dead') },
  { key: 'all',       filter: i => i },
]

export const GROUPS = Array.from(new Set(mockNeedItems.map(i => i.group))).sort()

export const DEFAULT_ORDER: ColKey[] = ['status', 'stock', 'doc', 'sales', 'need']
export const INIT_WIDTHS: ColWidths = { status: 180, stock: 180, doc: 180, sales: 180, need: 180 }

export const COL_CB     = 40
export const COL_MFR    = 280
export const COL_ACTION = 52
export const MIN_NAME   = 232
export const DRAWER_W   = 580

export const SEV_STYLE = {
  red:    { bar: 'bg-red-400',    badge: 'bg-red-50 text-red-500 dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]',           metric: 'text-red-500'    },
  orange: { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-600 dark:bg-[#78350F]/40 dark:text-[#FCD34D]',       metric: 'text-amber-600'  },
  blue:   { bar: 'bg-indigo-400', badge: 'bg-indigo-50 text-indigo-600 dark:bg-[#312E81]/40 dark:text-[#C4B5FD]',     metric: 'text-indigo-600' },
} as const

export const BRANCH_NAMES = [
  'Ул. Навои, 14',
  'Пр. Мустакиллик, 32',
  'Ул. Амира Темура, 8',
  'Ул. Бунёдкор, 21',
]
