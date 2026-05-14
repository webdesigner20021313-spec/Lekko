interface PaginationProps {
  page: number
  totalPages: number
  totalCount?: number
  hasPrevious: boolean
  hasNext: boolean
  isLoading?: boolean
  onChange: (page: number) => void
  /** Компактный — для popup'ов dropdown'ов. */
  variant?: 'default' | 'compact'
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  hasPrevious,
  hasNext,
  isLoading,
  onChange,
  variant = 'default',
}: PaginationProps) {
  const compact = variant === 'compact'

  const labelClass = compact
    ? 'text-[11px] text-gray-400'
    : 'text-sm text-gray-500 dark:text-gray-400'
  const btnClass = compact
    ? 'h-6 rounded border border-gray-200 px-2 text-[11px] disabled:opacity-40 dark:border-gray-700'
    : 'h-8 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:bg-gray-800'

  return (
    <div className={
      compact
        ? 'flex items-center justify-between gap-2 px-3 py-1.5'
        : 'flex items-center justify-between gap-3 px-4 py-2 text-sm'
    }>
      <span className={labelClass}>
        {compact ? (
          <>{page}/{totalPages}{totalCount ? ` · ${totalCount}` : ''}</>
        ) : (
          <>Стр. {page} из {totalPages}{totalCount ? ` · всего ${totalCount}` : ''}</>
        )}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); onChange(Math.max(1, page - 1)) }}
          disabled={!hasPrevious || isLoading}
          className={btnClass}
        >
          {compact ? '←' : '← Назад'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onChange(page + 1) }}
          disabled={!hasNext || isLoading}
          className={btnClass}
        >
          {compact ? '→' : 'Вперёд →'}
        </button>
      </div>
    </div>
  )
}
