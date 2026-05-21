/**
 * Helpers для скачивания PDF/Excel инвойса заказа и истории изменений.
 * Backend (Purchase API) рендерит файл через QuestPDF / ClosedXML и отдаёт
 * blob — здесь мы только формируем payload, выкачиваем blob и тригерим save.
 *
 * Имена препаратов/дистров/аптеки бекенд НЕ резолвит — frontend уже подгрузил
 * их через useDrugsCartEnrichment / useDistributorsBatch / useAuthStore.
 */
import { api } from '@/shared/api/client'

export interface InvoiceItemRow {
  medicineName: string
  manufacturer: string
  country: string
  quantity: number
  price: number
  /** Персональная скидка аптеки у дистра в %. null/0 → нет скидки. */
  discountPercent?: number | null
}

export interface InvoiceGroup {
  distributorName: string
  items: InvoiceItemRow[]
}

export interface InvoicePayload {
  orderNumber: string
  createdAt: string
  pharmacyName: string
  pharmacyAddress?: string | null
  groups: InvoiceGroup[]
}

export interface HistoryRow {
  type: 'quantity' | 'price' | 'replacement' | 'added' | 'removed'
  drugName: string
  oldValue?: string | null
  newValue?: string | null
  modifiedAt?: string | null
  appliedToClient: boolean
}

export interface HistoryPayload {
  orderNumber: string
  distributorName: string
  pharmacyName: string
  createdAt: string
  rows: HistoryRow[]
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function postForBlob(url: string, body: unknown, filename: string) {
  const resp = await api.post(url, body, { responseType: 'blob' })
  saveBlob(resp.data, filename)
}

export function downloadInvoicePdf(purchaseId: number, payload: InvoicePayload) {
  return postForBlob(
    `/api/purchases/${purchaseId}/invoice.pdf`,
    payload,
    `invoice-${payload.orderNumber}.pdf`,
  )
}

export function downloadInvoiceXlsx(purchaseId: number, payload: InvoicePayload) {
  return postForBlob(
    `/api/purchases/${purchaseId}/invoice.xlsx`,
    payload,
    `invoice-${payload.orderNumber}.xlsx`,
  )
}

export function downloadHistoryPdf(distributorOrderId: number, payload: HistoryPayload) {
  return postForBlob(
    `/api/distributor-orders/${distributorOrderId}/history.pdf`,
    payload,
    `history-${payload.orderNumber}.pdf`,
  )
}

export function downloadHistoryXlsx(distributorOrderId: number, payload: HistoryPayload) {
  return postForBlob(
    `/api/distributor-orders/${distributorOrderId}/history.xlsx`,
    payload,
    `history-${payload.orderNumber}.xlsx`,
  )
}
