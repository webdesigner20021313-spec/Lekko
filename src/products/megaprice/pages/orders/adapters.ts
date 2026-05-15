import type {
  ApiPurchase,
  ApiPurchaseOrder,
  ApiPurchaseOrderItem,
  ApiDistributorOrder,
  ApiDistributorOrderItem,
  ApiOrderStatus,
} from '@/products/megaprice/api/hooks'
import type {
  Order,
  OrderDistributorGroup,
  OrderStatus,
  DistributorStatus,
  WholesalerProposal,
  ProposalChange,
} from './types'

// ── Backend statusId → UI status маппинги ────────────────────────────────────

/** Purchase.status_id → UI OrderStatus (для list-view). */
export function mapPurchaseStatusToUi(statusId: number): OrderStatus {
  switch (statusId) {
    case 0: return 'new'        // активная корзина (обычно в /orders не показываем)
    case 1: return 'new'        // оформлена, ждёт ответа дистров
    case 2: return 'modified'   // дистры что-то поменяли
    case 3: return 'completed'  // одобрено / отгружено / доставлено
    case 4: return 'accepted'   // клиент принял предложение дистра (Phase 5)
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

// ── Diff (purchase /diff endpoint) → WholesalerProposal map per-distributor ──

interface BuildProposalsOpts {
  distributorOrders: ApiDistributorOrder[]
  distributorItems: ApiDistributorOrderItem[]
  clientItems: ApiPurchaseOrderItem[]
  drugInfoById?: Map<number, { name: string; producer: string; country: string }>
}

/**
 * Строит карту {distributorId → WholesalerProposal} из diff-response.
 * Proposal формируется только если у distributor_order есть реально модифицированные
 * items (isModified / isAdded / isRemoved). Для status_id=11 (отправлено клиенту
 * на проверку) это всегда true.
 *
 * Сравнение идёт по `purchaseOrderItemId`: client.id ↔ distributor.purchaseOrderItemId.
 * Если distributor-item не привязан к client-item (isAdded=1, purchaseOrderItemId=null)
 * — это добавленная позиция.
 */
export function buildProposalsByDistributor({
  distributorOrders,
  distributorItems,
  clientItems,
  drugInfoById,
}: BuildProposalsOpts): Map<string, WholesalerProposal> {
  const result = new Map<string, WholesalerProposal>()
  if (distributorOrders.length === 0) return result

  // client items по id (purchase_order_items.id), для resolve старых значений.
  const clientById = new Map<number, ApiPurchaseOrderItem>()
  clientItems.forEach((it) => clientById.set(it.id, it))

  // distributor_items сгруппированы по distributor_order_id.
  const distItemsByOrder = new Map<number, ApiDistributorOrderItem[]>()
  distributorItems.forEach((it) => {
    const arr = distItemsByOrder.get(it.distributorOrderId) ?? []
    arr.push(it)
    distItemsByOrder.set(it.distributorOrderId, arr)
  })

  for (const order of distributorOrders) {
    // Только status=11 — реально pending review. 12/13 уже разрешённые,
    // 10 — ещё не редактировал. Диффы показываем только когда дистр сабмитнул.
    if (order.statusId !== 11) continue

    const items = distItemsByOrder.get(order.id) ?? []
    const changes: ProposalChange[] = []

    for (const d of items) {
      const c = d.purchaseOrderItemId ? clientById.get(d.purchaseOrderItemId) : undefined
      const drug = drugInfoById?.get(Number(d.drugId))
      const medicineName = drug?.name ?? `Drug ${d.drugId}`

      // Removed (мягко удалена).
      if (d.isRemoved) {
        changes.push({
          itemId: String(c?.id ?? d.id),
          type: 'removed',
          oldValue: Number(c?.quantity ?? d.quantity ?? 0),
          newValue: 0,
          medicineName,
        })
        continue
      }

      // Added (новая позиция, без привязки к client-item).
      if (d.isAdded || !c) {
        changes.push({
          itemId: String(d.id),
          type: 'added',
          oldValue: '',
          newValue: Number(d.quantity ?? 0),
          medicineName,
          addedManufacturer: drug?.producer ?? '',
          addedCountry: drug?.country ?? '',
          addedPrice: Number(d.price ?? 0),
        })
        continue
      }

      // Substitute (заменён препарат).
      if (d.replacementDrugId && d.replacementDrugId !== d.drugId) {
        const replacementDrug = drugInfoById?.get(Number(d.replacementDrugId))
        changes.push({
          itemId: String(c.id),
          type: 'substitute',
          oldValue: medicineName,
          newValue: replacementDrug?.name ?? `Drug ${d.replacementDrugId}`,
          newManufacturer: replacementDrug?.producer,
          newCountry: replacementDrug?.country,
          medicineName,
        })
      }

      // Quantity diff.
      if (Number(d.quantity ?? 0) !== Number(c.quantity ?? 0)) {
        changes.push({
          itemId: String(c.id),
          type: 'quantity',
          oldValue: Number(c.quantity ?? 0),
          newValue: Number(d.quantity ?? 0),
          medicineName,
        })
      }

      // Price diff.
      if (Number(d.price ?? 0) !== Number(c.price ?? 0)) {
        changes.push({
          itemId: String(c.id),
          type: 'price',
          oldValue: Number(c.price ?? 0),
          newValue: Number(d.price ?? 0),
          medicineName,
        })
      }
    }

    if (changes.length > 0) {
      result.set(String(order.distributorId), {
        receivedAt: order.updateDate ?? order.createDate,
        changes,
      })
    }
  }

  return result
}

export type { ApiOrderStatus }
