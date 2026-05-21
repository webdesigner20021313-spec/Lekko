import type { CartItem, Pharmacy } from '@/products/megaprice/pages/purchase/types/purchase.types'

export interface DistGroup {
  id: string
  name: string
  city: string
  items: CartItem[]
  contactType: 'telegram' | 'email'
  contact: string
}

export interface InvoiceGroup extends DistGroup {
  subtotal: number
  qty: number
}

export interface ConfirmPayload {
  groups: InvoiceGroup[]
  pharmacy: Pharmacy
}
