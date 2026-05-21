import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TagSearchInput, TagOptionButton, TagChips } from '../TagControls'
import type { TagOption } from '../types'

/**
 * Синхронный тег-инпут: источник — конечный in-memory список `options`,
 * фильтрация на клиенте. Для серверного поиска с пагинацией — AsyncTagInput.
 */
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

  const selectedEntries = useMemo(
    () => selected
      .map(id => options.find(o => o.id === id))
      .filter((o): o is TagOption => Boolean(o))
      .map(o => ({ id: o.id, label: o.label })),
    [options, selected],
  )

  return (
    <div>
      <TagSearchInput
        value={query}
        onChange={(v) => { setQuery(v); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
      />

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
                <TagOptionButton
                  key={opt.id}
                  opt={opt}
                  onSelect={(id) => { onAdd(id); setQuery('') }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TagChips entries={selectedEntries} onRemove={onRemove} />
    </div>
  )
}
