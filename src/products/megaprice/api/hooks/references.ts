/**
 * Справочники: МНН (substances), производители, дистрибьюторы, регионы.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import type { PagedResponse, ProducerRef, SubstanceRef } from '@/shared/api/types'

export function useSubstances(query: string, opts: { drugId?: number; pageSize?: number } = {}) {
  return useQueryApiClient<SubstanceRef[] | PagedResponse<SubstanceRef>>({
    request: {
      url: '/api/drugsearch/reference/substances',
      method: 'GET',
      params: {
        query: query.trim() || undefined,
        drugId: opts.drugId,
        page: 1,
        pageSize: opts.pageSize ?? 50,
      },
    },
  })
}

/** GET /api/producers — paged + search производителей. */
export function useProducersPaged(opts: { query: string; page?: number; pageSize?: number; enabled?: boolean }) {
  return useQueryApiClient<PagedResponse<ProducerRef>>({
    request: {
      url: '/api/producers',
      method: 'GET',
      params: {
        search: opts.query.trim() || undefined,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
      },
    },
    enabled: opts.enabled ?? true,
  })
}

export interface DistributorRef {
  id: number
  name: string
  regionId?: number
  regionName?: string | null
  statusId?: number
  isOfficial?: boolean
  licenseDate?: string | null
  lastPriceDate?: string | null
}

/** GET /api/drugsearch/reference/distributors/paged — paged дистрибьюторы. */
export function useDistributorsPaged(opts: {
  query: string
  page?: number
  pageSize?: number
  drugStoreId?: number | null
  regionIds?: number[] | null
  favoritesOnly?: boolean
  priceAgeDays?: number | null
  /** activeOnly=true (default бэка) — только дистры со statusId=1. Передавайте false
   *  чтобы показать архивных тоже (например в /wholesalers admin-view). */
  activeOnly?: boolean
  enabled?: boolean
}) {
  return useQueryApiClient<{
    items: DistributorRef[]
    totalCount: number
    page: number
    pageSize: number
  }>({
    request: {
      url: '/api/drugsearch/reference/distributors/paged',
      method: 'GET',
      params: {
        search: opts.query.trim() || undefined,
        drugStoreId: opts.drugStoreId ?? undefined,
        regionIds: opts.regionIds && opts.regionIds.length > 0 ? opts.regionIds : undefined,
        favoritesOnly: opts.favoritesOnly || undefined,
        priceAgeDays: opts.priceAgeDays ?? undefined,
        activeOnly: opts.activeOnly ?? undefined,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
      },
    },
    enabled: opts.enabled ?? true,
  })
}

export interface RegionRef {
  id: number
  nameRu: string | null
  nameUz?: string | null
  shortNameRu?: string | null
  countryId?: number
}

/** GET /api/regions — справочник регионов с поиском. */
export function useRegions(opts: { query?: string; enabled?: boolean } = {}) {
  return useQueryApiClient<RegionRef[]>({
    request: {
      url: '/api/regions',
      method: 'GET',
      params: { search: (opts.query ?? '').trim() || undefined },
    },
    enabled: opts.enabled ?? true,
  })
}
