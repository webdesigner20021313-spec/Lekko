import { useTranslation } from 'react-i18next'
import { SearchableMultiSelect, type IdNameOption, type SelectSource } from '@/shared/ui-kit/SearchableMultiSelect'
import { useProducersPaged } from '@/products/megaprice/api/hooks'

const PAGE_SIZE = 50

/** Бэк хранит имена производителей в lowercase — UI ждёт Title Case. */
function titleCase(raw: string): string {
  return raw.replace(/\b([\p{L}])/gu, (m) => m.toLocaleUpperCase())
}

interface Props {
  selectedIds: number[]
  selectedCache: IdNameOption[]
  onToggle: (option: IdNameOption) => void
  onClear: () => void
}

/**
 * Multi-select производителей с серверным поиском+пагинацией.
 * Источник — useProducersPaged (GET /api/producers).
 */
export function ManufacturerDropdown({ selectedIds, selectedCache, onToggle, onClear }: Props) {
  const { t } = useTranslation()
  return (
    <SearchableMultiSelect
      label={t('filter_manufacturer')}
      selectedIds={selectedIds}
      selectedCache={selectedCache}
      onToggle={onToggle}
      onClear={onClear}
      useSource={useProducersSource}
      pageSize={PAGE_SIZE}
    />
  )
}

function useProducersSource({ query, page, enabled }: {
  query: string; page: number; enabled: boolean
}): SelectSource {
  const r = useProducersPaged({ query, page, pageSize: PAGE_SIZE, enabled })
  const d = r.data
  const items: IdNameOption[] = (d?.items ?? [])
    .filter((p) => p.id > 0 && (p.name ?? '').trim().length > 0)
    .map((p) => ({ id: p.id, name: titleCase(p.name) }))
  return {
    items,
    isLoading: r.isLoading,
    page: d?.pageNumber,
    totalPages: d?.totalPages,
    totalCount: d?.totalCount,
    hasPrevious: d?.hasPrevious,
    hasNext: d?.hasNext,
  }
}
