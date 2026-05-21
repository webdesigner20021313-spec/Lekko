import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Search, Users, Pill, Store, Clock } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import {
  useDistributorSearchStats,
  useDistributorPharmacyStats,
  useDistributorRecentSearches,
  useDrugStoresBatch,
  useDrugsEnrichment,
  type SearchStatEntry,
  type PharmacyStatEntry,
  type RecentSearchEntry,
  type ApiDrugStoreBrief,
  type ApiDrugBrief,
} from '@/pages/DistributorPortal/api/hooks'
import { DistributorAnalytics } from '@/pages/DistributorPortal/DistributorAnalytics'

type Tab = 'overview' | 'products' | 'pharmacies' | 'recent'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Обзор' },
  { key: 'pharmacies', label: 'Активность по аптекам' },
  { key: 'products', label: 'Активность по препаратам' },
  { key: 'recent', label: 'Недавние поиски' },
]

// Пресеты периода для фильтра (значение = сколько дней назад от сегодня; 0 = всё время).
const PERIODS: Array<{ key: string; label: string; days: number }> = [
  { key: '7', label: '7 дней', days: 7 },
  { key: '30', label: '30 дней', days: 30 },
  { key: '90', label: '90 дней', days: 90 },
  { key: '365', label: 'Год', days: 365 },
  { key: 'all', label: 'Всё время', days: 0 },
]

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function AnalyticsSection({ distributorIds }: { distributorIds: number[] }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState('90')
  const ids = distributorIds.length ? distributorIds : null

  const sel = PERIODS.find((p) => p.key === period) ?? PERIODS[2]
  const fromDate = sel.days > 0 ? isoDaysAgo(sel.days) : '2000-01-01'
  const toDate = isoDaysAgo(-1) // завтра — чтобы захватить сегодняшние записи

  return (
    <div>
      {/* Вкладки + фильтр периода */}
      <div className="border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-[#111111]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                  tab === t.key
                    ? 'border-gray-900 text-gray-900 dark:border-[#f1f1f1] dark:text-gray-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Фильтр периода */}
          <div className="flex items-center gap-1 py-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  period === p.key
                    ? 'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#222222]',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* key=tab → fade при переключении вкладок (без сдвига). */}
      <div key={tab} className="animate-fade-in">
        {tab === 'overview' && <OverviewTab distributorIds={ids} fromDate={fromDate} toDate={toDate} />}
        {tab === 'products' && <DistributorAnalytics distributorIds={distributorIds} fromDate={fromDate} toDate={toDate} />}
        {tab === 'pharmacies' && <PharmaciesActivityTab distributorIds={ids} fromDate={fromDate} toDate={toDate} />}
        {tab === 'recent' && <RecentTab distributorIds={ids} fromDate={fromDate} toDate={toDate} />}
      </div>
    </div>
  )
}

// ─── Обзор: KPI-сводка ──────────────────────────────────────────────────────

function OverviewTab({ distributorIds, fromDate, toDate }: { distributorIds: number[] | null; fromDate: string; toDate: string }) {
  const searches = useDistributorSearchStats(distributorIds, fromDate, toDate)
  const pharmacies = useDistributorPharmacyStats(distributorIds, fromDate, toDate)
  const drugRows = (searches.data as SearchStatEntry[] | undefined) ?? []
  const pharmRows = (pharmacies.data as PharmacyStatEntry[] | undefined) ?? []

  const totalSearches = drugRows.reduce((s, x) => s + x.searchCount, 0)
  const drugCount = drugRows.length
  const pharmacyCount = pharmRows.length

  const enrich = useDrugsEnrichment()
  useEffect(() => {
    const dids = drugRows.map((r) => r.drugId).filter((id) => id > 0)
    if (dids.length) enrich.appendData({ ids: Array.from(new Set(dids)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugRows])
  const drugName = useMemo(() => {
    const m = new Map<number, string>()
    ;((enrich.data as ApiDrugBrief[] | undefined) ?? []).forEach((d) => m.set(d.id, d.fullName))
    return m
  }, [enrich.data])

  const topDrugs = useMemo(
    () => [...drugRows].sort((a, b) => b.searchCount - a.searchCount).slice(0, 10).map((r) => ({
      name: (drugName.get(r.drugId) || `#${r.drugId}`).slice(0, 24),
      Поиски: r.searchCount,
    })),
    [drugRows, drugName],
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi icon={<Search className="h-4 w-4" />} label="Всего поисков" value={totalSearches.toLocaleString('ru-RU')} />
        <Kpi icon={<Store className="h-4 w-4" />} label="Активных аптек" value={String(pharmacyCount)} />
        <Kpi icon={<Pill className="h-4 w-4" />} label="Препаратов искали" value={String(drugCount)} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Топ-10 искомых препаратов</h2>
        {searches.isLoading ? (
          <p className="py-12 text-center text-sm text-gray-400">Загружаем…</p>
        ) : topDrugs.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">Нет данных по поисковой активности</p>
        ) : (
          <div className="relative w-full" style={{ height: 320 }}>
            {/* absolute → график не влияет на высоту страницы (нет цикла скролл↔ресайз). */}
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDrugs} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                  <Tooltip />
                  <Bar dataKey="Поиски" fill="#1a73e8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Активность по аптекам ────────────────────────────────────────────────

function PharmaciesActivityTab({ distributorIds, fromDate, toDate }: { distributorIds: number[] | null; fromDate: string; toDate: string }) {
  const api = useDistributorPharmacyStats(distributorIds, fromDate, toDate)
  const rows = (api.data as PharmacyStatEntry[] | undefined) ?? []

  const storesApi = useDrugStoresBatch()
  useEffect(() => {
    const ids = rows.map((r) => r.drugStoreId).filter((id) => id > 0)
    if (ids.length) storesApi.appendData({ ids: Array.from(new Set(ids)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])
  const nameById = useMemo(() => {
    const m = new Map<number, string>()
    ;((storesApi.data as ApiDrugStoreBrief[] | undefined) ?? []).forEach((s) =>
      m.set(s.id, s.nameRu || s.nameUz || s.name || `Аптека #${s.id}`))
    return m
  }, [storesApi.data])

  const sorted = useMemo(() => [...rows].sort((a, b) => b.searchCount - a.searchCount), [rows])

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <Users className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Аптеки, искавшие ваши препараты</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#222222]">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Аптека</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Поисков</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Последний поиск</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {api.isLoading && rows.length === 0 ? (
              <tr><td colSpan={3} className="py-16 text-center text-sm text-gray-400">Загружаем…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={3} className="py-16 text-center text-sm text-gray-400">Пока нет активности</td></tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.drugStoreId} className="hover:bg-gray-50 dark:hover:bg-[#222222]">
                  <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">
                    {nameById.get(r.drugStoreId) || r.drugStoreName || `Аптека #${r.drugStoreId}`}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{r.searchCount.toLocaleString('ru-RU')}</td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
                    {r.lastSearchDate ? new Date(r.lastSearchDate).toLocaleString('ru-RU') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

// ─── Недавние поиски ──────────────────────────────────────────────────────

function RecentTab({ distributorIds, fromDate, toDate }: { distributorIds: number[] | null; fromDate: string; toDate: string }) {
  const api = useDistributorRecentSearches(distributorIds, fromDate, toDate)
  const rows = (api.data as RecentSearchEntry[] | undefined) ?? []

  const storesApi = useDrugStoresBatch()
  const drugsApi = useDrugsEnrichment()
  useEffect(() => {
    const sids = rows.map((r) => r.drugStoreId).filter((id) => id > 0)
    const dids = rows.map((r) => r.drugId).filter((id) => id > 0)
    if (sids.length) storesApi.appendData({ ids: Array.from(new Set(sids)) })
    if (dids.length) drugsApi.appendData({ ids: Array.from(new Set(dids)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])
  const storeName = useMemo(() => {
    const m = new Map<number, string>()
    ;((storesApi.data as ApiDrugStoreBrief[] | undefined) ?? []).forEach((s) =>
      m.set(s.id, s.nameRu || s.nameUz || s.name || `Аптека #${s.id}`))
    return m
  }, [storesApi.data])
  const drugName = useMemo(() => {
    const m = new Map<number, string>()
    ;((drugsApi.data as ApiDrugBrief[] | undefined) ?? []).forEach((d) => m.set(d.id, d.fullName))
    return m
  }, [drugsApi.data])

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <Clock className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Лента последних поисков</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#222222]">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Когда</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Аптека</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Препарат</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {api.isLoading && rows.length === 0 ? (
              <tr><td colSpan={3} className="py-16 text-center text-sm text-gray-400">Загружаем…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="py-16 text-center text-sm text-gray-400">Пока нет поисков</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.drugStoreId}-${r.drugId}-${i}`} className="hover:bg-gray-50 dark:hover:bg-[#222222]">
                  <td className="px-4 py-2.5 text-sm tabular-nums text-gray-500 dark:text-gray-400">{new Date(r.searchDate).toLocaleString('ru-RU')}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">{storeName.get(r.drugStoreId) || r.drugStoreName || `Аптека #${r.drugStoreId}`}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{drugName.get(r.drugId) || r.drugName || `#${r.drugId}`}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}
