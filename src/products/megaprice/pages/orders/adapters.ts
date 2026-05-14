import type {
  ApiPurchase,
  ApiPurchaseOrder,
  ApiPurchaseOrderItem,
  ApiOrderStatus,
} from '@/products/megaprice/api/hooks'
import type {
  Order,
  OrderDistributorGroup,
  OrderStatus,
  DistributorStatus,
} from './types'

// ── Backend statusId → UI status маппинги ────────────────────────────────────

/** Purchase.status_id → UI OrderStatus (для list-view). */
export function mapPurchaseStatusToUi(statusId: number): OrderStatus {
  switch (statusId) {
    case 0: return 'new'        // активная корзина (обычно в /orders не показываем)
    case 1: return 'new'        // оформлена, ждёт ответа дистров
    case 2: return 'modified'   // дистры что-то поменяли
    case 3: return 'completed'  // одобрено / отгружено / доставлено
    case 5:
    case 6: return 'cancelled'  // закрыта/отменена
    default: return 'new'
  }
}

/** Order.status_id (внутри purchase) → UI OrderStatus. */
export function mapOrderStatusToUi(statusId: number): OrderStatus {
  switch (statusId) {
    case 11: return 'modified'
    case 12:
    case 14:
    case 15: return 'completed'
    case 13: return 'cancelled'
    case 0:
    case 10:
    default: return 'new'
  }
}

export function mapStatusIdToDistributorStatus(statusId: number): DistributorStatus {
  switch (statusId) {
    case 10: return 'sent'
    case 11: return 'offer'
    case 12: return 'accepted'
    case 13: return 'rejected'
    case 14:
    case 15: return 'accepted'
    default: return 'new'
  }
}

// ── Purchase (list-view) → UI Order ──────────────────────────────────────────

interface BuildOpts {
  pharmacyName?: string | null
  pharmacyAddress?: string | null
  pharmacyCity?: string | null
}

interface ListBuildOpts extends BuildOpts {
  /** Имена дистров по id — обычно из useDistributorsBatch. Опционально:
   *  пока имена не загрузились, groups содержат только id. */
  distributorNameById?: Map<number, string>
}

export function buildOrderFromPurchase(p: ApiPurchase, opts: ListBuildOpts = {}): Order {
  // Если purchase ещё активна (status=0) но в ней УЖЕ есть placed orders —
  // это partial-placed закупка. Показываем как «new» (ждёт дистра).
  const status =
    p.statusId === 0 && p.placedOrderCount > 0
      ? 'new'
      : mapPurchaseStatusToUi(p.statusId)

  // Реальные distributor_ids приходят из бекенда (ARRAY_AGG DISTINCT).
  // Имена подтягиваются батчем через /api/distributors/batch и передаются в opts.
  // Если бекенд не вернул ids (старая версия) — fallback на placeholder-группы
  // по orderCount.
  const ids = p.distributorIds && p.distributorIds.length > 0
    ? p.distributorIds
    : Array.from({ length: p.placedOrderCount > 0 ? p.placedOrderCount : p.orderCount }, () => 0)

  const groups: OrderDistributorGroup[] = ids.map((id) => ({
    distributorId: id ? String(id) : '',
    distributorName: id ? (opts.distributorNameById?.get(id) ?? '') : '',
    distributorCity: '',
    contactType: 'email' as const,
    contact: '',
    distributorStatus: 'new',
    items: [],
    subtotal: 0,
  }))

  return {
    id: String(p.id),
    number: p.purchaseNumber || `ЗАК-${p.id}`,
    pharmacyName: opts.pharmacyName ?? '',
    pharmacyAddress: opts.pharmacyAddress ?? '',
    pharmacyCity: opts.pharmacyCity ?? '',
    groups,
    totalSum: p.totalSum,
    totalQty: p.totalQty || p.itemCount,
    lineCount: p.itemCount,
    status,
    createdAt: p.createDate || new Date().toISOString(),
  }
}

export function buildOrdersFromPurchases(items: ApiPurchase[], opts: ListBuildOpts = {}): Order[] {
  return items
    .map((p) => buildOrderFromPurchase(p, opts))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ── Purchase detail → UI Order с groups+items ────────────────────────────────

interface BuildDetailOpts extends BuildOpts {
  purchase: ApiPurchase
  orders: ApiPurchaseOrder[]
  items: ApiPurchaseOrderItem[]
  distributorNameById?: Map<number, string>
  /** name + producer + country из /api/drugs/cart-enrichment. */
  drugInfoById?: Map<number, { name: string; producer: string; country: string }>
}

export function buildOrderFromPurchaseDetail({
  purchase,
  orders,
  items,
  distributorNameById,
  drugInfoById,
  pharmacyName,
  pharmacyAddress,
  pharmacyCity,
}: BuildDetailOpts): Order {
  // items раскладываем по orderId.
  const itemsByOrder = new Map<number, ApiPurchaseOrderItem[]>()
  items.forEach((it) => {
    const oid = Number(it.orderId)
    if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, [])
    itemsByOrder.get(oid)!.push(it)
  })

  const groups: OrderDistributorGroup[] = orders.map((o) => {
    const oi = itemsByOrder.get(o.id) ?? []
    const subtotal = oi.reduce(
      (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
      0,
    )
    return {
      distributorId: String(o.distributorId),
      distributorName:
        o.distributorName?.trim() ||
        distributorNameById?.get(o.distributorId) ||
        `Дистр ${o.distributorId}`,
      distributorCity: '',
      contactType: 'email',
      contact: '',
      distributorStatus: mapStatusIdToDistributorStatus(o.statusId),
      items: oi.map((it) => {
        const info = drugInfoById?.get(Number(it.drugId))
        return {
          id: String(it.id),
          medicineName:
            info?.name ??
            (it.productName as string | undefined) ??
            `Drug ${it.drugId}`,
          manufacturer: info?.producer ?? '',
          country: info?.country ?? '',
          quantity: Number(it.quantity ?? 0),
          priceWithVat: Number(it.price ?? 0),
        }
      }),
      subtotal: subtotal > 0 ? subtotal : o.totalSum,
    }
  })

  const totalSum = groups.reduce((s, g) => s + g.subtotal, 0)
  const totalQty = groups.reduce(
    (s, g) => s + g.items.reduce((qs, i) => qs + i.quantity, 0),
    0,
  )

  const lineCount = groups.reduce((s, g) => s + g.items.length, 0) || purchase.itemCount

  return {
    id: String(purchase.id),
    number: purchase.purchaseNumber || `ЗАК-${purchase.id}`,
    pharmacyName: pharmacyName ?? '',
    pharmacyAddress: pharmacyAddress ?? '',
    pharmacyCity: pharmacyCity ?? '',
    groups,
    totalSum: totalSum > 0 ? totalSum : purchase.totalSum,
    totalQty: totalQty > 0 ? totalQty : purchase.itemCount,
    lineCount,
    status: mapPurchaseStatusToUi(purchase.statusId),
    createdAt: purchase.createDate || new Date().toISOString(),
  }
}

export type { ApiOrderStatus }
