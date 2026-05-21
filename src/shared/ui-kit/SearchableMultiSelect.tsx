import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { Pagination } from './Pagination'

export interface IdNameOption {
  id: number
  name: string
}

/**
 * Унифицированный источник данных для select'ов с серверным поиском.
 * Реализуется как небольшой адаптер вокруг useApiQuery — см. примеры в
 * api/hooks/references.ts (useProducersPaged, useDistributorsPaged).
 */
export interface SelectSource {
  items: IdNameOption[]
  isLoading: boolean
  /** Если undefined — пагинация не показывается. */
  page?: number
  totalPages?: number
  totalCount?: number
  hasPrevious?: boolean
  hasNext?: boolean
}

export interface SearchableMultiSelectProps {
  label: string
  /** id выбранных. */
  selectedIds: number[]
  /** Кэш ранее выбранных — чтобы ✓ оставались на других страницах. */
  selectedCache?: IdNameOption[]
  onToggle: (option: IdNameOption) => void
  onClear: () => void
  /** Хук-источник: получает (query, page) и возвращает SelectSource. */
  useSource: (args: { query: string; page: number; enabled: boolean }) => SelectSource
  /** Сколько элементов показываем на странице (server-side). */
  pageSize?: number
  /** Ширина контрол-кнопки и popup'а. */
  width?: number
  /** Если true — использовать compact-pagination или вообще без неё (для маленьких справочников). */
  noPagination?: boolean
  className?: string
}

export function SearchableMultiSelect({
  label,
  selectedIds,
  selectedCache = [],
  onToggle,
  onClear,
  useSource,
  pageSize: _pageSize = 50,
  width = 200,
  noPagination = false,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Закрытие по клику вне.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Сброс query/page при открытии + автофокус в input.
  useEffect(() => {
    if (open) {
      setQuery('')
      setPage(1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Дебаунс query — иначе на каждую клавишу летит API.
  const debouncedQuery = useDebouncedValue(query, 300)

  // Сброс page при смене (debounced) query.
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  const source = useSource({ query: debouncedQuery, page, enabled: open })

  const checkedSet = useMemo(() => {
    const s = new Set<number>(selectedIds)
    selectedCache.forEach((c) => s.add(c.id))
    return s
  }, [selectedIds, selectedCache])

  const count = selectedIds.length
  const hasSelected = count > 0
  const showPagination =
    !noPagination &&
    source.totalCount !== undefined &&
    source.totalPages !== undefined &&
    source.totalCount > (source.items.length || 1) &&
    source.totalPages > 1

  return (
    <div ref={wrapperRef} className={cn('relative shrink-0', className)} style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-full items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
          open
            ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-[#222222] dark:text-gray-100'
            : hasSelected
              ? 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-200'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
        )}
      >
        <span className="flex-1 truncate text-left">
          {hasSelected ? `${label} · ${count}` : label}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-10 z-50 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#111111]"
          style={{ width: Math.max(width, 240) }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-[#333333]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск…"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 text-sm outline-none focus:border-gray-400 focus:bg-white dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200 dark:focus:bg-gray-700"
              />
              {query && (
                <button
                  onClick={(e) => { e.stopPropagation(); setQuery('') }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="max-h-[216px] overflow-y-auto py-1">
            {source.isLoading && source.items.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">Загрузка…</p>
            ) : source.items.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">Ничего не найдено</p>
            ) : (
              source.items.map((opt) => {
                const checked = checkedSet.has(opt.id)
                return (
                  <label
                    key={opt.id}
                    onClick={() => onToggle(opt)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      checked
                        ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                        : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">{opt.name}</span>
                  </label>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {showPagination && source.page !== undefined && (
            <div className="border-t border-gray-100 dark:border-[#333333]">
              <Pagination
                variant="compact"
                page={source.page}
                totalPages={source.totalPages!}
                totalCount={source.totalCount}
                hasPrevious={source.hasPrevious ?? source.page > 1}
                hasNext={source.hasNext ?? source.page < (source.totalPages ?? 0)}
                isLoading={source.isLoading}
                onChange={setPage}
              />
            </div>
          )}

          {/* Reset all */}
          {hasSelected && (
            <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
              <button
                onClick={onClear}
                className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
