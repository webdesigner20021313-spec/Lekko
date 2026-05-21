import { Search, Check, X } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { inputCls } from '../config'
import type { TagOption } from '../types'

/**
 * Общие презентационные примитивы для тег-инпутов (TagInput / AsyncTagInput).
 * Сама логика выбора (sync-фильтр vs серверная пагинация) живёт в обёртках —
 * здесь только разметка, чтобы не копипастить её между двумя компонентами.
 */

/** Поле поиска (Search-иконка + input). Open-состояние и обработчики — у родителя. */
export function TagSearchInput({
  value, onChange, onFocus, onBlur, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onFocus: () => void
  onBlur: () => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(inputCls, 'pl-8')}
      />
    </div>
  )
}

/** Одна строка дропдауна: label + sublabel + Check на hover. */
export function TagOptionButton({
  opt, onSelect,
}: {
  opt: TagOption
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      // onMouseDown (не onClick): срабатывает до blur поля поиска, иначе dropdown
      // успевает закрыться по setTimeout раньше клика.
      onMouseDown={(e) => { e.preventDefault(); onSelect(opt.id) }}
      className="group flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</span>
      {opt.sublabel && (
        <span className="shrink-0 truncate text-xs text-gray-400 dark:text-[#929292]">{opt.sublabel}</span>
      )}
      <Check className="h-4 w-4 shrink-0 text-gray-900 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-300" />
    </button>
  )
}

/** Чипсы выбранных значений с кнопкой удаления. */
export function TagChips({
  entries, onRemove,
}: {
  entries: { id: string; label: string }[]
  onRemove: (id: string) => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {entries.map((e) => (
        <span
          key={e.id}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[13px] font-medium text-gray-700 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200"
        >
          {e.label}
          <button
            type="button"
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => onRemove(e.id)}
            className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  )
}
