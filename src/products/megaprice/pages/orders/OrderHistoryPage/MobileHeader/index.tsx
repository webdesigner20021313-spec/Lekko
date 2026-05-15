import { Search, SlidersHorizontal, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'

export function MobileHeader({
  search,
  setSearch,
  hasFilters,
  onOpenFilters,
  onExport,
}: {
  search: string
  setSearch: (v: string) => void
  hasFilters: boolean
  onOpenFilters: () => void
  onExport: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 md:hidden">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t('orders_search_ph')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-base placeholder-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder-gray-500"
        />
      </div>
      <button
        onClick={onOpenFilters}
        className={cn(
          'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
          hasFilters
            ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
            : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400',
        )}
        aria-label={t('orders_filters')}
      >
        <SlidersHorizontal className="h-5 w-5" />
        {hasFilters && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#111111]" />
        )}
      </button>
      <button
        onClick={onExport}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-600 bg-green-600 text-white"
        aria-label="Excel"
      >
        <Download className="h-5 w-5" />
      </button>
    </div>
  )
}
