/**
 * DrugSearch — поиск каталога и офферов по препарату/дистрибьютору.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import type { DrugSearchRow, PagedResponse, PriceOffer } from '@/shared/api/types'

/**
 * POST /api/drugsearch/search — поиск каталога.
 * Стартует на mount (enableOnMount), пере-запросится при смене любого пропса.
 */
export function useDrugSearch(opts: {
  drugStoreId: number | null
  drugName: string
  substanceId?: number | null
  producerIds?: number[] | null
  countryId?: number | null
  showProducers?: boolean
  favoritesOnly?: boolean
  page?: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQueryApiClient<PagedResponse<DrugSearchRow>>({
    request: {
      url: '/api/drugsearch/search',
      method: 'POST',
      data: {
        drugStoreId: opts.drugStoreId,
        drugName: opts.drugName,
        substanceId: opts.substanceId ?? undefined,
        producerIds: opts.producerIds && opts.producerIds.length > 0 ? opts.producerIds : undefined,
        countryId: opts.countryId ?? undefined,
        showProducers: opts.showProducers ?? false,
        favoritesOnly: opts.favoritesOnly ?? false,
      },
      params: { page: opts.page ?? 1, pageSize: opts.pageSize ?? 30 },
      enableOnMount: true,
    },
    enabled: (opts.enabled ?? true) && !!opts.drugStoreId,
  })
}

/** GET /api/drugsearch/search/by-drug-id/{id} — все офферы одного drug. */
export function useOffersByDrugId(drugId: number | null | undefined, opts: {
  page?: number
  pageSize?: number
  priceAgeDays?: number
  distributorIds?: number[]
  regionIds?: number[]
} = {}) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<PagedResponse<PriceOffer>>({
    request: {
      url: `/api/drugsearch/search/by-drug-id/${drugId ?? 0}`,
      method: 'GET',
      params: {
        drugStoreId,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
        priceAgeDays: opts.priceAgeDays,
        distributorIds: opts.distributorIds && opts.distributorIds.length > 0 ? opts.distributorIds : undefined,
        regionIds: opts.regionIds && opts.regionIds.length > 0 ? opts.regionIds : undefined,
      },
      // Офферы кэшируем на 60с — переключение туда-обратно между препаратами
      // не дёргает бэк (тяжёлый запрос: ~250-700ms на 100+ дистрах).
      // Внутри 60с — мгновенный синхронный return cached. refetch() форсит fresh.
      staleTimeMs: 60_000,
    },
    enabled: !!drugStoreId && !!drugId,
  })
}

/** GET /api/drugsearch/price-lists/{id}/items — прайс-лист дистрибьютора. */
export function useDistributorPriceItems(distributorId: number | null | undefined, opts: {
  page?: number
  pageSize?: number
} = {}) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<PagedResponse<PriceOffer>>({
    request: {
      url: `/api/drugsearch/price-lists/${distributorId ?? 0}/items`,
      method: 'GET',
      params: { drugStoreId, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 },
    },
    enabled: !!drugStoreId && !!distributorId,
  })
}
