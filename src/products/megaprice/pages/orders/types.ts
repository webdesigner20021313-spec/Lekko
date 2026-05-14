// ── Global order status ───────────────────────────────────────────────────────
export type OrderStatus = 'new' | 'modified' | 'completed' | 'cancelled'

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
  bg: string
  text: string
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  new:       { bg: 'bg-[#DBEAFE] dark:bg-[#1E3A8A]/40', text: 'text-[#1E40AF] dark:text-[#93C5FD]' },
  modified:  { bg: 'bg-[#FFEDD5] dark:bg-[#78350F]/40', text: 'text-[#9A3412] dark:text-[#FCD34D]' },
  completed: { bg: 'bg-[#D1FAE5] dark:bg-[#064E3B]/40', text: 'text-[#065F46] dark:text-[#6EE7B7]' },
  cancelled: { bg: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40', text: 'text-[#991B1B] dark:text-[#FCA5A5]' },
}

export const DISTRIBUTOR_STATUS_CONFIG: Record<DistributorStatus, OrderStatusConfig> = {
  new:          { bg: 'bg-[#F3F4F6] dark:bg-gray-700', text: 'text-[#374151] dark:text-gray-300' },
  sent:         { bg: 'bg-[#EDE9FE] dark:bg-[#4C1D95]/40', text: 'text-[#5B21B6] dark:text-[#C4B5FD]' },
  partial_sent: { bg: 'bg-[#FEF3C7] dark:bg-[#78350F]/40', text: 'text-[#92400E] dark:text-[#FCD34D]' },
  offer:        { bg: 'bg-[#FEF3C7] dark:bg-[#78350F]/40', text: 'text-[#92400E] dark:text-[#FCD34D]' },
  accepted:     { bg: 'bg-[#D1FAE5] dark:bg-[#064E3B]/40', text: 'text-[#065F46] dark:text-[#6EE7B7]' },
  rejected:     { bg: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40', text: 'text-[#991B1B] dark:text-[#FCA5A5]' },
  cancelled:    { bg: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40', text: 'text-[#991B1B] dark:text-[#FCA5A5]' },
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
  /** Сумма quantity по всем позициям (sum). На list-view равна lineCount,
   *  пока бекенд не отдаёт отдельный агрегат. */
  totalQty: number
  /** Число строк в заказе (COUNT(poi.id) от бекенда). */
  lineCount: number
  status: OrderStatus
  createdAt: string
}
