import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDistributorsPaged, useRegions } from '@/products/megaprice/api/hooks'
import { mapDistributorRefToDistributor } from '@/products/megaprice/api/adapters'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { Pagination } from '@/shared/ui-kit/Pagination'
import { CityDropdown } from './SupplierOffers/CityDropdown'
import type { IdNameOption } from '@/shared/ui-kit/SearchableMultiSelect'
import { formatDate } from '@/shared/utils/format'
import { cn } from '@/shared/utils/utils'
import type { Distributor } from '@/products/megaprice/pages/purchase/types/purchase.types'

const PAGE_SIZE = 30

interface WholesalersViewProps {
  selectedId: string | null
  onSelect: (distributor: Distributor) => void
}

/**
 * Список дистрибьюторов через серверный API.
 *  - search — `?search=` с дебаунсом 300мс (внутри useDistributorsPaged).
 *  - город — multi-select по region_id; на текущей странице фильтруется на фронте,
 *    бэк-эндпоинт `/distributors/paged` пока не принимает regionIds[] как фильтр.
 *  - пагинация — через общий Pagination.
 */
export function WholesalersView({ selectedId, onSelect }: WholesalersViewProps) {
  const { t } = useTranslation()
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [cityIds, setCityIds] = useState<number[]>([])
  const [selectedCities, setSelectedCities] = useState<IdNameOption[]>([])

  const cityKey = cityIds.slice().sort((a, b) => a - b).join(',')
  useEffect(() => {
    setPage(1)
  }, [search, cityKey])

  const distributors = useDistributorsPaged({
    query: search,
    page,
    pageSize: PAGE_SIZE,
    drugStoreId,
    regionIds: cityIds.length > 0 ? cityIds : undefined,
  })

  // region.id → name для отображения «города» в карточке.
  const regions = useRegions()
  const regionNameById = useMemo(() => {
    const m = new Map<number, string>()
    if (Array.isArray(regions.data)) {
      regions.data.forEach((r) => r.nameRu && m.set(r.id, r.nameRu))
    }
    return m
  }, [regions.data])

  const items: Distributor[] = useMemo(() => {
    const raw = distributors.data?.items ?? []
    return raw.map((d) =>
      mapDistributorRefToDistributor(d, d.regionId ? regionNameById.get(d.regionId) : null),
    )
  }, [distributors.data?.items, regionNameById])

  const data = distributors.data
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1
  const showPagination = data && data.totalCount > PAGE_SIZE

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filter_search_inner')}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:focus:border-gray-500"
          />
        </div>

        <CityDropdown
          selectedIds={cityIds}
          selectedCache={selectedCities}
          onToggle={(opt) => {
            const isAdding = !cityIds.includes(opt.id)
            setCityIds(
              isAdding ? [...cityIds, opt.id] : cityIds.filter((id) => id !== opt.id),
            )
            setSelectedCities(
              isAdding
                ? [...selectedCities.filter((s) => s.id !== opt.id), opt]
                : selectedCities.filter((s) => s.id !== opt.id),
            )
          }}
          onClear={() => {
            setCityIds([])
            setSelectedCities([])
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {distributors.isLoading && items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {t('filter_nothing_found')}
          </div>
        ) : (
          <DistributorList items={items} selectedId={selectedId} onSelect={onSelect} startIndex={(page - 1) * PAGE_SIZE} />
        )}
      </div>

      {showPagination && (
        <div className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <Pagination
            page={data.page}
            totalPages={totalPages}
            totalCount={data.totalCount}
            hasPrevious={data.page > 1}
            hasNext={data.page < totalPages}
            isLoading={distributors.isLoading}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  )
}

interface DistributorListProps {
  items: Distributor[]
  selectedId: string | null
  onSelect: (d: Distributor) => void
  startIndex?: number
}

function DistributorList({ items, selectedId, onSelect, startIndex = 0 }: DistributorListProps) {
  const { t } = useTranslation()
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-[#333333]">
        {items.map((dist) => {
          const isSelected = dist.id === selectedId
          return (
            <div
              key={dist.id}
              onClick={() => onSelect(dist)}
              className={cn(
                'relative flex cursor-pointer items-center gap-3 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-800',
                isSelected ? 'bg-gray-50 dark:bg-[#222222]' : 'bg-white dark:bg-[#111111]',
              )}
            >
              {isSelected && <span className="absolute left-0 top-0 bottom-0 w-1 bg-gray-900 dark:bg-[#f1f1f1]" />}
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm', isSelected ? 'font-semibold' : 'font-medium', 'text-gray-900 dark:text-gray-100')}>
                  {dist.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#929292]">{dist.city || '—'}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {dist.lastPriceDate ? formatDate(dist.lastPriceDate) : ''}
              </span>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <table className="hidden md:table" style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: 48 }} />
          <col />
          <col style={{ width: 130 }} />
        </colgroup>
        <thead>
          <tr style={{ height: 48, background: 'var(--table-header-bg)', borderBottom: '1px solid var(--table-border)', position: 'sticky', top: 0, zIndex: 2 }}>
            <th className="px-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">№</th>
            <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">
              {t('col_distributor')}
            </th>
            <th className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">
              {t('col_price_date')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((dist, i) => {
            const isSelected = dist.id === selectedId
            return (
              <tr
                key={dist.id}
                onClick={() => onSelect(dist)}
                className={cn(
                  'cursor-pointer border-b border-gray-100 transition-colors dark:border-[#333333]',
                  isSelected ? 'bg-gray-100 dark:bg-[#222222]' : 'hover:bg-gray-50 dark:hover:bg-gray-800',
                )}
              >
                <td className={cn(
                  'px-4 py-3 text-center text-xs text-gray-400',
                  isSelected && 'border-l-2 border-l-gray-900 dark:border-l-blue-400',
                )}>
                  {startIndex + i + 1}
                </td>
                <td className="px-4 py-3">
                  <p className={cn('text-sm text-gray-900 dark:text-gray-100', isSelected ? 'font-semibold' : 'font-medium')}>
                    {dist.name}
                  </p>
                  {dist.city && <p className="text-xs text-gray-500 dark:text-[#929292]">{dist.city}</p>}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                  {dist.lastPriceDate ? formatDate(dist.lastPriceDate) : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
