/**
 * Batch-обогащение (для cart-page и списков): резолв drug/distributor по id.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

export function useDrugsBatch() {
  return useQueryApiClient<{ id: number; fullName: string }[]>({
    request: { url: '/api/drugs/batch', method: 'POST', disableOnMount: true },
  })
}

/**
 * POST /api/drugs/cart-enrichment — узкая проекция для cart-карточек:
 * id, fullName, doza, quantity, producerName, countryName, inn.
 * Эти поля нужны cart-row'ам для отображения «производитель + страна».
 * /api/drugs/batch возвращает голое drug-entity без producer/country.
 */
export interface DrugCartEnrichment {
  id: number
  fullName: string
  doza: string | null
  quantity: number
  producerName: string | null
  countryName: string | null
  inn: string | null
}

export function useDrugsCartEnrichment() {
  return useQueryApiClient<DrugCartEnrichment[]>({
    request: { url: '/api/drugs/cart-enrichment', method: 'POST', disableOnMount: true },
  })
}

export interface DistributorFull {
  id: number
  name: string
  /** Реальный phone обычно null; контактный номер хранится в `contacts`. */
  phone: string | null
  contacts: string | null
  email: string | null
  emails: string | null
  emailForOrders: string | null
  telegramIdFirst: number | null
  telegramIdSecond: number | null
  inn: string | null
  minOrderAmount: number | null
  deliveryDays: number | null
  workingHours: string | null
  /** Часто содержит «г.Ташкент» — fallback для city. */
  note: string | null
  address: string | null
  regionId: number | null
  isOfficial: number
}

export function useDistributorsBatch() {
  return useQueryApiClient<DistributorFull[]>({
    request: { url: '/api/distributors/batch', method: 'POST', disableOnMount: true },
  })
}
