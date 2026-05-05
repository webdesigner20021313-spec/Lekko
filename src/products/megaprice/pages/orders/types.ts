// ── Global order status ───────────────────────────────────────────────────────
export type OrderStatus = 'new' | 'completed' | 'cancelled'

// ── Per-distributor status inside an order ────────────────────────────────────
export type DistributorStatus =
  | 'new'          // ещё не отправлен
  | 'sent'         // отправлен дистрибутору
  | 'partial_sent' // отправлен частично
  | 'offer'        // дистрибутор прислал предложение
  | 'accepted'     // клиент принял предложение
  | 'rejected'     // клиент отклонил предложение
  | 'cancelled'    // отменён

export interface OrderStatusConfig {
  label: string
  bg: string
  text: string
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  new:       { label: 'Новый',    bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]' },
  completed: { label: 'Завершён', bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' },
  cancelled: { label: 'Отменён',  bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' },
}

export const DISTRIBUTOR_STATUS_CONFIG: Record<DistributorStatus, OrderStatusConfig> = {
  new:          { label: 'Новый',               bg: 'bg-[#F3F4F6]', text: 'text-[#374151]' },
  sent:         { label: 'Отправлен',           bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]' },
  partial_sent: { label: 'Частично отправлен',  bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  offer:        { label: 'Предложение',         bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  accepted:     { label: 'Принято',             bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' },
  rejected:     { label: 'Отклонено',           bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' },
  cancelled:    { label: 'Отменён',             bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' },
}

// ── Wholesaler proposal ───────────────────────────────────────────────────────

export interface ProposalChange {
  itemId: string
  type: 'quantity' | 'price' | 'substitute'
  oldValue: number | string
  newValue: number | string
  newManufacturer?: string
  newCountry?: string
}

export interface WholesalerProposal {
  receivedAt: string // ISO string
  changes: ProposalChange[]
}

// ── Order entities ────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string
  medicineName: string
  manufacturer: string
  country: string
  quantity: number
  priceWithVat: number
}

export interface OrderDistributorGroup {
  distributorId: string
  distributorName: string
  distributorCity: string
  contactType: 'telegram' | 'email'
  contact: string
  distributorStatus: DistributorStatus
  sentAt?: string
  items: OrderItem[]
  subtotal: number
  proposal?: WholesalerProposal
}

export interface Order {
  id: string
  number: string
  pharmacyName: string
  pharmacyAddress: string
  pharmacyCity: string
  groups: OrderDistributorGroup[]
  totalSum: number
  totalQty: number
  status: OrderStatus
  createdAt: string
}
