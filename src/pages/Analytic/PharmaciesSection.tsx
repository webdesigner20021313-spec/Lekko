import { useMemo, useState } from 'react'
import { Building2, MapPin, Phone, Mail, Search } from 'lucide-react'
import { Pagination } from '@/shared/ui-kit/Pagination'
import { useAllPharmacies, type ApiDrugStoreFull } from '@/pages/DistributorPortal/api/hooks'

// Раздел «Мои аптеки» — справочник всех аптек системы (GET /api/drugstores, пагинация).

function label(ds: ApiDrugStoreFull) {
  return ds.nameRu || ds.nameUz || ds.name || `Аптека #${ds.id}`
}

export function PharmaciesSection() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [query, setQuery] = useState('')
  const api = useAllPharmacies(page, pageSize)
  const data = api.data as
    | { items?: ApiDrugStoreFull[]; totalCount?: number; totalPages?: number; hasNext?: boolean; hasPrevious?: boolean }
    | undefined
  const items = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize))

  // Поиск по текущей странице (бэк не принимает search-параметр).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((d) =>
      label(d).toLowerCase().includes(q) ||
      (d.address ?? '').toLowerCase().includes(q) ||
      (d.phone ?? '').toLowerCase().includes(q),
    )
  }, [items, query])

  return (
    <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по странице…"
            className="h-9 w-72 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200"
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Всего аптек: {totalCount.toLocaleString('ru-RU')}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#222222]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Аптека</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Адрес</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Контакты</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {api.isLoading && items.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-gray-400">Загружаем…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-gray-400">Ничего не найдено</td></tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-[#222222]">
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{d.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label(d)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {d.address ? (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0 text-gray-400" />{d.address}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="space-y-0.5">
                      {d.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</span>}
                      {d.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{d.email}</span>}
                      {!d.phone && !d.email && <span>—</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация — общий компонент, как на megaprice */}
      {totalCount > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            hasPrevious={page > 1}
            hasNext={page < totalPages}
            isLoading={api.isLoading}
            onChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      )}
    </main>
  )
}
