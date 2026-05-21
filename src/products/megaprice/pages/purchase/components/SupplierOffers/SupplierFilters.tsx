import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { IdNameOption } from '@/shared/ui-kit/SearchableMultiSelect'
import type { BonusType, ColumnKey } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { DistributorDropdown } from './DistributorDropdown'
import { CityDropdown } from './CityDropdown'
import { BonusDropdown } from './BonusDropdown'
import { SupplierColumnsMenu } from './SupplierColumnsMenu'

export type { IdNameOption } from '@/shared/ui-kit/SearchableMultiSelect'

interface Props {
  drugStoreId?: number | null

  distributorIds: number[]
  selectedDistributors: IdNameOption[]
  onToggleDistributor: (option: IdNameOption) => void
  onClearDistributors: () => void

  cityIds: number[]
  selectedCities: IdNameOption[]
  onToggleCity: (option: IdNameOption) => void
  onClearCities: () => void

  bonusFilter: BonusType[]
  onBonusChange: (next: BonusType[]) => void

  visibleColumns: Record<ColumnKey, boolean>
  onToggleColumn: (key: ColumnKey) => void

  showColumnToggle?: boolean
}

/**
 * Тонкий оркестратор фильтров справа. Каждый dropdown — отдельный компонент:
 *  - DistributorDropdown — server-side multi-select из useDistributorsPaged
 *  - CityDropdown — server-side multi-select из useRegions
 *  - BonusDropdown — локальный (бэк не возвращает bonus-метаданные)
 *  - SupplierColumnsMenu — переключатель видимых колонок таблицы
 */
export function SupplierFilters({
  drugStoreId,
  distributorIds,
  selectedDistributors,
  onToggleDistributor,
  onClearDistributors,
  cityIds,
  selectedCities,
  onToggleCity,
  onClearCities,
  bonusFilter,
  onBonusChange,
  visibleColumns,
  onToggleColumn,
  showColumnToggle = true,
}: Props) {
  const { t } = useTranslation()

  const hasAnyFilter =
    distributorIds.length > 0 || cityIds.length > 0 || bonusFilter.length > 0

  function clearAll() {
    onClearDistributors()
    onClearCities()
    onBonusChange([])
  }

  return (
    <div className="hidden md:flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
      <DistributorDropdown
        drugStoreId={drugStoreId}
        selectedIds={distributorIds}
        selectedCache={selectedDistributors}
        onToggle={onToggleDistributor}
        onClear={onClearDistributors}
      />

      <CityDropdown
        selectedIds={cityIds}
        selectedCache={selectedCities}
        onToggle={onToggleCity}
        onClear={onClearCities}
      />

      <BonusDropdown value={bonusFilter} onChange={onBonusChange} />

      {hasAnyFilter && (
        <button
          onClick={clearAll}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
          {t('filter_clear')}
        </button>
      )}

      {showColumnToggle && (
        <SupplierColumnsMenu visibleColumns={visibleColumns} onToggleColumn={onToggleColumn} />
      )}
    </div>
  )
}
