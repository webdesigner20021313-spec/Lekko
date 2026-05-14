export interface Pharmacy {
  id: string
  name: string
  address: string
  city: string
}

export interface Medicine {
  id: string
  /** Backend drug_id для последующих API-вызовов (offers/analogs). */
  drugId?: number
  name: string
  mnn: string
  mnnLatin?: string
  manufacturer: string
  country: string
  isFavorite: boolean
  stock?: number
  needed?: number
}

export type BonusType = 'cashback' | 'gift' | 'free_delivery' | 'discount'

export interface PaymentOption {
  percentage: number | null   // процент предоплаты (null = договорная)
  days: number | null         // дней отсрочки
  label: string               // читаемое название
}

export interface Distributor {
  id: string
  name: string
  city: string
  lastPriceDate: string
  contactType: 'telegram' | 'email'
  contact: string
}

export interface SupplierOffer {
  id: string
  medicineId: string
  distributor: Distributor
  expiryDate: string
  paymentTypes: PaymentOption[]   // один или несколько вариантов оплаты
  priceWithVat: number
  originalPrice?: number          // перечёркнутая старая цена (если есть скидка)
  bonus?: { type: BonusType; label: string }
  promotion?: string
}

export interface CartItem {
  offerId: string
  medicineId: string
  quantity: number
  offer: SupplierOffer
  medicine: Medicine
}

export interface AutoSelectSettings {
  distributorIds: string[]
  manufacturerIds: string[]
  priority: 'price' | 'expiry' | 'payment'
  maxPrice?: number
}

export type MedicineListTab = 'manual' | 'pos' | 'excel'
export type ColumnKey = 'expiry' | 'payment' | 'price' | 'bonus' | 'quantity'
export type SortField = 'price' | 'expiry'
export type SortDirection = 'asc' | 'desc'
