import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TagSearchInput, TagOptionButton, TagChips } from '../TagControls'
import type { TagOption } from '../types'

/**
 * Тег-инпут с серверной пагинацией. Источник данных — родитель: передаёт items
 * + hasNext + setQuery + onLoadMore(). Скролл вниз dropdown'а триггерит
 * onLoadMore (intersection observer). Для in-memory списков используйте TagInput.
 *
 *  - `selectedLabels`: Map id→label для рендера тегов (т.к. id может быть выбран
 *    но отсутствовать на текущей странице — отдельный кеш на родителе).
 */
export function AsyncTagInput({
  query,
  setQuery,
  items,
  hasNext,
  isLoading,
  onLoadMore,
  selected,
  selectedLabels,
  onAdd,
  onRemove,
  placeholder,
}: {
  query: string
  setQuery: (q: string) => void
  items: TagOption[]
  hasNext: boolean
  isLoading: boolean
  onLoadMore: () => void
  selected: string[]
  selectedLabels: Map<string, string>
  onAdd: (id: string) => void
  onRemove: (id: string) => void
  placeholder?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  // Sentinel внизу списка для intersection observer (infinite scroll).
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open || !hasNext || isLoading) return
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onLoadMore()
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [open, hasNext, isLoading, onLoadMore])

  const filtered = items.filter((o) => !selected.includes(o.id))
  const selectedEntries = selected.map((id) => ({ id, label: selectedLabels.get(id) ?? id }))

  return (
    <div>
      <TagSearchInput
        value={query}
        onChange={setQuery}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />

      {open && (
        <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-[#111111]">
          {filtered.length === 0 && !isLoading ? (
            <p className="px-3 py-3 text-center text-sm text-gray-400">
              {query ? t('filter_nothing_found') : t('autoselect_start_typing')}
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((opt) => (
                <TagOptionButton key={opt.id} opt={opt} onSelect={onAdd} />
              ))}
              {hasNext && (
                <div ref={sentinelRef} className="px-3 py-2 text-center text-xs text-gray-400">
                  {isLoading ? t('common_loading', { defaultValue: 'Загрузка…' }) : ''}
                </div>
              )}
              {isLoading && !hasNext && (
                <p className="px-3 py-2 text-center text-xs text-gray-400">
                  {t('common_loading', { defaultValue: 'Загрузка…' })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <TagChips entries={selectedEntries} onRemove={onRemove} />
    </div>
  )
}
