import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { IdNameOption } from '@/shared/ui-kit/SearchableMultiSelect'
import { ManufacturerDropdown } from './ManufacturerDropdown'
import { ColumnsMenu } from './ColumnsMenu'

export type MedicineColumnKey = 'mnn' | 'stock' | 'needed'
export type ManufacturerOption = IdNameOption

interface Props {
  search: string
  onSearch: (value: string) => void
  selectedManufacturerIds: number[]
  selectedManufacturers?: ManufacturerOption[]
  onToggleManufacturer: (option: ManufacturerOption) => void
  onClearManufacturers: () => void
  visibleColumns: Record<MedicineColumnKey, boolean>
  onToggleColumn: (key: MedicineColumnKey) => void
  columnOptions?: { key: MedicineColumnKey; label: string }[]
}

/**
 * Тонкий компонент-оркестратор: search input + ManufacturerDropdown + ColumnsMenu.
 * Вся бизнес-логика (debounce, server-side fetch, pagination) внутри подкомпонентов.
 */
export function MedicineFilters({
  search,
  onSearch,
  selectedManufacturerIds,
  selectedManufacturers = [],
  onToggleManufacturer,
  onClearManufacturers,
  visibleColumns,
  onToggleColumn,
  columnOptions,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <SearchInput value={search} onChange={onSearch} placeholder={t('filter_search')} />

      <ManufacturerDropdown
        selectedIds={selectedManufacturerIds}
        selectedCache={selectedManufacturers}
        onToggle={onToggleManufacturer}
        onClear={onClearManufacturers}
      />

      <ColumnsMenu
        visibleColumns={visibleColumns}
        onToggleColumn={onToggleColumn}
        options={columnOptions}
      />
    </div>
  )
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative min-w-[240px] flex-1">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-7 text-sm text-gray-900 placeholder-gray-400',
          'outline-none focus:border-gray-400',
          'dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
