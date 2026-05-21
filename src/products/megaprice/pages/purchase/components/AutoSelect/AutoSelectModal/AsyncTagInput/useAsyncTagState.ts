import { useState } from 'react'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { TagOption } from '../types'

/**
 * Состояние async-тег-инпута: query/page/accumulated + дедуп между страницами.
 * Сам HTTP-запрос выполняет родитель (напр. `useDistributorsPaged`) — он должен
 * быть на верхнем уровне компонента (правила React-хуков), а сюда результат
 * прокидывается через `feed()`.
 *
 * Использование:
 *   const tag = useAsyncTagState(30)
 *   const query = useDistributorsPaged({ query: tag.debouncedQuery, page: tag.page, pageSize: 30 })
 *   tag.feed(query.data, query.isLoading, (d) => ({ id: String(d.id), label: d.name }))
 *   // и передать tag.items / tag.hasNext / tag.isLoading / tag.onLoadMore в AsyncTagInput
 */
export function useAsyncTagState(pageSize = 30) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebouncedValue(query, 300)
  const [accumulated, setAccumulated] = useState<TagOption[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Сброс страницы и accumulated при смене query — на фазе рендера, без эффекта
  // (рекомендованный React-паттерн «adjusting state on prop change»: без лишнего
  // ре-рендера и flash старых результатов).
  const [prevQuery, setPrevQuery] = useState(debouncedQuery)
  if (debouncedQuery !== prevQuery) {
    setPrevQuery(debouncedQuery)
    setPage(1)
    setAccumulated([])
  }

  function feed<T>(
    data: { items: T[]; totalCount: number } | undefined,
    loading: boolean,
    toOption: (item: T) => TagOption,
  ) {
    setIsLoading(loading)
    // useQueryApiClient инициализирует data как [] (массив, не объект) до первого
    // ответа — поэтому проверяем что это реально объект с items, а не пустой массив.
    if (!data || !Array.isArray((data as { items?: unknown }).items)) return
    const pageItems = data.items.map(toOption)
    setTotalCount(data.totalCount)
    setAccumulated((prev) => {
      if (page === 1) return pageItems
      const seen = new Set(prev.map((o) => o.id))
      return [...prev, ...pageItems.filter((o) => !seen.has(o.id))]
    })
  }

  const hasNext = accumulated.length < totalCount

  return {
    query,
    setQuery,
    debouncedQuery,
    page,
    pageSize,
    items: accumulated,
    totalCount,
    hasNext,
    isLoading,
    feed,
    onLoadMore: () => { if (hasNext && !isLoading) setPage((p) => p + 1) },
  }
}
