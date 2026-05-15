/**
 * Helpers для сборки payload, отправляемого на backend для генерации
 * PDF/Excel инвойса. Имена дистров/препаратов/аптеки уже резолвлены
 * клиентом — здесь только приводим в форму, ожидаемую API.
 *
 * Персональную скидку (per distributor) тянем из useDiscountStore — это shared
 * store, заполняется автозагрузкой при mount страниц. Чтобы PDF/Excel показывал
 * Скидку и Итого со скидкой, передаём процент в каждой позиции payload'а.
 */
import type {
  Order,
  OrderDistributorGroup,
} from '@/products/megaprice/pages/orders/types'
import type { InvoicePayload } from '@/products/megaprice/api/invoice'
import { useDiscountStore } from '@/products/megaprice/stores/useDiscountStore'

export type ModalState =
  | { kind: 'complete' }
  | { kind: 'cancel_order' }
  | { kind: 'cancel_distributor'; distributorId: string; distributorName: string }
  | { kind: 'history'; distributorOrderId: number; distributorName: string }

function discountFor(distributorId: string | number | null | undefined): number | null {
  if (distributorId === null || distributorId === undefined) return null
  const id = typeof distributorId === 'string' ? Number(distributorId) : distributorId
  if (!Number.isFinite(id)) return null
  return useDiscountStore.getState().byDistributorId.get(id) ?? null
}

export function buildGroupPayload(group: OrderDistributorGroup, order: Order): InvoicePayload {
  const dp = discountFor(group.distributorId)
  return {
    orderNumber: `${order.number}_${group.distributorName}`,
    createdAt: new Date(order.createdAt).toISOString(),
    pharmacyName: order.pharmacyName,
    pharmacyAddress: [order.pharmacyAddress, order.pharmacyCity].filter(Boolean).join(', '),
    groups: [{
      distributorName: group.distributorName,
      items: group.items.map(i => ({
        medicineName: i.medicineName,
        manufacturer: i.manufacturer,
        country: i.country,
        quantity: i.quantity,
        price: i.priceWithVat,
        discountPercent: dp,
      })),
    }],
  }
}

export function buildFullPayload(order: Order): InvoicePayload {
  return {
    orderNumber: order.number,
    createdAt: new Date(order.createdAt).toISOString(),
    pharmacyName: order.pharmacyName,
    pharmacyAddress: [order.pharmacyAddress, order.pharmacyCity].filter(Boolean).join(', '),
    groups: order.groups.map(g => {
      const dp = discountFor(g.distributorId)
      return {
        distributorName: g.distributorName,
        items: g.items.map(i => ({
          medicineName: i.medicineName,
          manufacturer: i.manufacturer,
          country: i.country,
          quantity: i.quantity,
          price: i.priceWithVat,
          discountPercent: dp,
        })),
      }
    }),
  }
}
