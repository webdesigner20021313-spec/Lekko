import { useTranslation } from 'react-i18next'
import { SearchableMultiSelect, type IdNameOption, type SelectSource } from '@/shared/ui-kit/SearchableMultiSelect'
import { useDistributorsPaged } from '@/products/megaprice/api/hooks'

const PAGE_SIZE = 50

interface Props {
  drugStoreId?: number | null
  selectedIds: number[]
  selectedCache: IdNameOption[]
  onToggle: (option: IdNameOption) => void
  onClear: () => void
}

/** Multi-select дистрибьюторов с серверным поиском+пагинацией. */
export function DistributorDropdown({ drugStoreId, selectedIds, selectedCache, onToggle, onClear }: Props) {
  const { t } = useTranslation()
  const useSource = ({ query, page, enabled }: { query: string; page: number; enabled: boolean }): SelectSource => {
    const r = useDistributorsPaged({ query, page, pageSize: PAGE_SIZE, drugStoreId, enabled })
    const d = r.data
    // Бэк отдаёт {items, totalCount, page, pageSize} — pages/flags вычисляем сами.
    const totalPages = d ? Math.max(1, Math.ceil(d.totalCount / d.pageSize)) : undefined
    const pageNumber = d?.page
    return {
      items: (d?.items ?? []).map((item) => ({ id: item.id, name: item.name })),
      isLoading: r.isLoading,
      page: pageNumber,
      totalPages,
      totalCount: d?.totalCount,
      hasPrevious: pageNumber !== undefined ? pageNumber > 1 : undefined,
      hasNext: pageNumber !== undefined && totalPages !== undefined ? pageNumber < totalPages : undefined,
    }
  }

  return (
    <SearchableMultiSelect
      label={t('filter_distributor')}
      selectedIds={selectedIds}
      selectedCache={selectedCache}
      onToggle={onToggle}
      onClear={onClear}
      useSource={useSource}
      pageSize={PAGE_SIZE}
    />
  )
}
