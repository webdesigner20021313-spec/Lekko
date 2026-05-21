import { useEffect, useMemo, type ReactNode } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Search, Users, Pill } from 'lucide-react'
import {
  useDistributorSearchStats,
  useDrugsEnrichment,
  type SearchStatEntry,
  type ApiDrugBrief,
} from './api/hooks'

/**
 * Дашборд «Мои аптеки» — поисковая активность клиентов по препаратам дистрибьютора.
 * Источник — ClientInsights (легаси item_search_logs/_dt, наполняется живым поиском),
 * агрегат по всем филиалам логина. Имена препаратов резолвим через drugs-enrichment.
 */
export function DistributorAnalytics({
  distributorIds,
  fromDate,
  toDate,
}: {
  distributorIds: number[]
  fromDate?: string
  toDate?: string
}) {
  const stats = useDistributorSearchStats(distributorIds.length ? distributorIds : null, fromDate, toDate)
  const rows = useMemo(
    () => ((stats.data as SearchStatEntry[] | undefined) ?? []),
    [stats.data],
  )

  // Резолв drug_id → имя (бэк отдаёт drugName пустым).
  const enrich = useDrugsEnrichment()
  useEffect(() => {
    const ids = rows.map((r) => r.drugId).filter((id) => id > 0)
    if (ids.length) enrich.appendData({ ids: Array.from(new Set(ids)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const nameById = useMemo(() => {
    const map = new Map<number, string>()
    ;((enrich.data as ApiDrugBrief[] | undefined) ?? []).forEach((d) => map.set(d.id, d.fullName))
    return map
  }, [enrich.data])

  const drugLabel = (r: SearchStatEntry) =>
    nameById.get(r.drugId) || r.drugName || `#${r.drugId}`

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.searchCount - a.searchCount),
    [rows],
  )

  const totalSearches = rows.reduce((s, x) => s + x.searchCount, 0)
  const maxUnique = rows.reduce((m, x) => Math.max(m, x.uniqueUsers), 0)
  const drugCount = rows.length

  const chartData = useMemo(
    () => sorted.slice(0, 12).map((r) => ({
      name: drugLabel(r).length > 22 ? drugLabel(r).slice(0, 21) + '…' : drugLabel(r),
      Поиски: r.searchCount,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorted, nameById],
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard icon={<Search className="h-4 w-4" />} label="Всего поисков" value={totalSearches.toLocaleString('ru-RU')} />
        <KpiCard icon={<Users className="h-4 w-4" />} label="Уникальных клиентов (макс. по препарату)" value={String(maxUnique)} />
        <KpiCard icon={<Pill className="h-4 w-4" />} label="Препаратов искали" value={String(drugCount)} />
      </div>

      {/* Chart — топ искомых препаратов */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Топ искомых препаратов</h2>
        {stats.isLoading ? (
          <p className="py-16 text-center text-sm text-gray-400">Загружаем…</p>
        ) : chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">Пока нет поисковой активности по вашим препаратам</p>
        ) : (
          <div className="relative w-full" style={{ height: 360 }}>
            {/* absolute → график не влияет на высоту страницы (нет цикла скролл↔ресайз). */}
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
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

      {/* Table */}
      {sorted.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#222222]">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Препарат</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Поисков</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Клиентов</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Последний поиск</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
              {sorted.map((r) => (
                <tr key={r.drugId} className="hover:bg-gray-50 dark:hover:bg-[#222222]">
                  <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">{drugLabel(r)}</td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{r.searchCount.toLocaleString('ru-RU')}</td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{r.uniqueUsers}</td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
                    {new Date(r.lastSearchDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
