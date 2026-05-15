import type { Medicine, SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'

export interface AutoSelectResult {
  medicine: Medicine
  offer: SupplierOffer | null
}

export interface LocalResult {
  medicine: Medicine
  offer: SupplierOffer | null
  reason: 'ok' | 'no_offers' | 'filtered_out'
}

// Пустой массив = нет ограничений
// Иерархия алгоритма: город → дистрибутор → производитель → цена
export interface Settings {
  cityFilter:        string[]
  supplierIds:       string[]
  manufacturerNames: string[]
  priceDeviationPct: string
}

export interface TagOption {
  id: string
  label: string
  sublabel?: string
}
