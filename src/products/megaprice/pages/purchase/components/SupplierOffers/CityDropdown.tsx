import { useTranslation } from 'react-i18next'
import { SearchableMultiSelect, type IdNameOption, type SelectSource } from '@/shared/ui-kit/SearchableMultiSelect'
import { useRegions } from '@/products/megaprice/api/hooks'

interface Props {
  selectedIds: number[]
  selectedCache: IdNameOption[]
  onToggle: (option: IdNameOption) => void
  onClear: () => void
}

/** Multi-select городов (регионов). Поиск через API, без пагинации (≈14 шт.). */
export function CityDropdown({ selectedIds, selectedCache, onToggle, onClear }: Props) {
  const { t } = useTranslation()
  const useSource = ({ query, enabled }: { query: string; page: number; enabled: boolean }): SelectSource => {
    const r = useRegions({ query, enabled })
    const items: IdNameOption[] = (Array.isArray(r.data) ? r.data : [])
      .filter((reg) => reg.id > 0 && (reg.nameRu ?? '').trim().length > 0)
      .map((reg) => ({ id: reg.id, name: reg.nameRu ?? '' }))
    return { items, isLoading: r.isLoading }
  }

  return (
    <SearchableMultiSelect
      label={t('filter_city')}
      selectedIds={selectedIds}
      selectedCache={selectedCache}
      onToggle={onToggle}
      onClear={onClear}
      useSource={useSource}
      noPagination
    />
  )
}
