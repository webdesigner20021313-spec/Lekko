import { useState, useMemo } from 'react'
import { Search, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { inputCls } from '../config'
import type { TagOption } from '../types'

export function TagInput({
  options, selected, onAdd, onRemove, placeholder,
}: {
  options: TagOption[]
  selected: string[]
  onAdd: (id: string) => void
  onRemove: (id: string) => void
  placeholder?: string
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => options.filter(o =>
    !selected.includes(o.id) &&
    (!query ||
      o.label.toLowerCase().includes(query.toLowerCase()) ||
      (o.sublabel ?? '').toLowerCase().includes(query.toLowerCase()))
  ), [options, selected, query])

  const selectedOptions = useMemo(
    () => selected.map(id => options.find(o => o.id === id)).filter(Boolean) as TagOption[],
    [options, selected]
  )

  return (
    <div>
      {/* Поле поиска */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          className={cn(inputCls, 'pl-8')}
        />
      </div>

      {/* Выпадающий список */}
      {open && (
        <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-[#111111]">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-sm text-gray-400">
              {query
                ? t('filter_nothing_found')
                : selected.length === options.length
                  ? t('autoselect_all_selected')
                  : t('autoselect_start_typing')}
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto">
              {filtered.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); onAdd(opt.id); setQuery('') }}
                  className="group flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="shrink-0 text-xs text-gray-400 dark:text-[#929292]">{opt.sublabel}</span>
                  )}
                  <Check className="h-4 w-4 shrink-0 text-gray-900 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Теги выбранных */}
      {selectedOptions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {selectedOptions.map(opt => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[13px] font-medium text-gray-700 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200"
            >
              {opt.label}
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => onRemove(opt.id)}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
