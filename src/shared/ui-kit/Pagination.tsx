import { useState, useRef, useEffect } from 'react'
import { cn } from '@/shared/utils/utils'

interface PaginationProps {
  page: number
  totalPages: number
  totalCount?: number
  /** Текущий размер страницы. Если не передан — dropdown скрыт. */
  pageSize?: number
  /** Опции в dropdown'е. Default [20, 50, 100, 500]. */
  pageSizeOptions?: number[]
  hasPrevious: boolean
  hasNext: boolean
  isLoading?: boolean
  onChange: (page: number) => void
  /** Если передан — рисуем dropdown выбора размера. */
  onPageSizeChange?: (size: number) => void
  /** Компактный — для popup'ов / dropdown'ов. */
  variant?: 'default' | 'compact'
}

/**
 * Условный ряд страниц: `[1, '…', 4, 5, 6, '…', 50]`.
 *  - всегда показываем первую и последнюю
 *  - вокруг текущей — 1 слева/справа
 *  - заполнители `…` где разрывы > 1
 */
function pageRange(current: number, total: number): (number | 'gap')[] {
  if (total <= 0) return []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, 'gap', total]
  if (current >= total - 3) return [1, 'gap', total - 4, total - 3, total - 2, total - 1, total]
  return [1, 'gap', current - 1, current, current + 1, 'gap', total]
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  pageSizeOptions = [20, 50, 100, 500],
  hasPrevious,
  hasNext,
  isLoading,
  onChange,
  onPageSizeChange,
  variant = 'default',
}: PaginationProps) {
  const compact = variant === 'compact'

  const labelClass = compact
    ? 'text-[11px] text-gray-400'
    : 'text-sm text-gray-500 dark:text-gray-400'

  const btnBase = compact
    ? 'h-7 min-w-[28px] rounded border border-gray-200 px-2 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700'
    : 'h-8 min-w-[32px] rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:bg-gray-800'

  const btnActive = 'border-gray-900 bg-gray-900 text-white hover:bg-black dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'

  const pages = pageRange(page, totalPages)

  return (
    <div className={cn(
      compact
        ? 'flex flex-wrap items-center justify-between gap-2 px-3 py-1.5'
        : 'flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm',
    )}>
      {/* Слева — счётчик */}
      <span className={labelClass}>
        {compact
          ? <>{page}/{totalPages}{totalCount ? ` · ${totalCount}` : ''}</>
          : <>Стр. {page} из {totalPages}{totalCount ? ` · всего ${totalCount}` : ''}</>}
      </span>

      {/* Центр — кнопки страниц */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onChange(Math.max(1, page - 1)) }}
          disabled={!hasPrevious || isLoading}
          className={btnBase}
          aria-label="Предыдущая страница"
        >‹</button>

        {pages.map((p, idx) =>
          p === 'gap'
            ? <span key={`gap-${idx}`} className="px-1 text-gray-400 text-xs select-none">…</span>
            : (
              <button
                key={p}
                onClick={(e) => { e.stopPropagation(); onChange(p) }}
                disabled={isLoading || p === page}
                className={cn(btnBase, p === page && btnActive)}
                aria-current={p === page ? 'page' : undefined}
              >{p}</button>
            ),
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onChange(page + 1) }}
          disabled={!hasNext || isLoading}
          className={btnBase}
          aria-label="Следующая страница"
        >›</button>
      </div>

      {/* Справа — dropdown размера */}
      {onPageSizeChange && pageSize !== undefined ? (
        <PageSizeDropdown
          value={pageSize}
          options={pageSizeOptions}
          onChange={onPageSizeChange}
          compact={compact}
        />
      ) : (
        // Сохраняем layout justify-between даже без dropdown
        <span className="w-0" />
      )}
    </div>
  )
}

function PageSizeDropdown({
  value, options, onChange, compact,
}: {
  value: number
  options: number[]
  onChange: (n: number) => void
  compact: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const btnClass = compact
    ? 'h-7 rounded border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300'
    : 'h-8 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className={btnClass}
      >
        {value} / страница ▾
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 overflow-hidden rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-[#111111]">
          {options.map((n) => (
            <button
              key={n}
              onClick={(e) => { e.stopPropagation(); onChange(n); setOpen(false) }}
              className={cn(
                'block w-full px-4 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800',
                n === value
                  ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-700 dark:text-gray-300',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
