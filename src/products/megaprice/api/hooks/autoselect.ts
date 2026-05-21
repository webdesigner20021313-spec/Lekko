/**
 * AutoSelect — массовый подбор лучшего оффера по списку препаратов.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

/**
 * Оффер из ответа /auto-select. Это SearchResult DTO бэка — те же поля что
 * в обычной выдаче DrugSearch, плюс DiscountedPrice/DiscountPercent.
 * Минимальный набор для UI / addToCart.
 */
export interface AutoSelectOffer {
  itemId: number
  priceId: number
  drugId: number
  drugName: string
  distributorId: number
  distributorName: string
  regionId?: number | null
  regionName?: string | null
  producerId: number | null
  producerName: string | null
  countryName: string | null
  price: number
  discountPercent: number | null
  discountedPrice: number | null
  expireDate?: string | null
  expireDateStr?: string | null
}

export interface AutoSelectItem {
  drugId: number
  /** 'ok' | 'no_offers' | 'filtered_out' */
  reason: 'ok' | 'no_offers' | 'filtered_out'
  offer: AutoSelectOffer | null
  avgPrice: number | null
}

export interface AutoSelectRequestBody {
  drugStoreId: number
  drugIds: number[]
  regionIds?: number[]
  distributorIds?: number[]
  /** Имена производителей (фронт даёт строки из Medicine.manufacturer). */
  producerNames?: string[]
  /** Максимальное отклонение от средней цены в %. */
  priceDeviationPct?: number
  priceAgeDays?: number
}

/**
 * POST /api/drugsearch/auto-select — массовый подбор лучшего оффера.
 *   const auto = useAutoSelect()
 *   auto.appendData({ drugStoreId, drugIds: [...], producerNames: [...] })
 *   // Результат: auto.data: AutoSelectItem[]
 */
export function useAutoSelect() {
  return useQueryApiClient<AutoSelectItem[]>({
    request: { url: '/api/drugsearch/auto-select', method: 'POST', disableOnMount: true },
    onSuccess: (data, pass) => {
      // pass — третий аргумент appendData. Поддерживаем callback-форму:
      //   api.appendData(body, undefined, (resp) => { ... })
      if (typeof pass === 'function') (pass as (d: AutoSelectItem[]) => void)(data as AutoSelectItem[])
    },
  })
}
