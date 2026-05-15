import * as XLSX from 'xlsx'
import { formatDate } from '@/shared/utils/format'
import type { Order } from '@/products/megaprice/pages/orders/types'

export function toISO(d: Date) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Прогоняет «20240115...» → «20.01.2024 - 21.01.2024» по маске. */
export function applyDateMask(digits: string): string {
  const d = digits.slice(0, 16)
  let result = ''
  result += d.slice(0, 2)
  if (d.length > 2) result += '.' + d.slice(2, 4)
  if (d.length > 4) result += '.' + d.slice(4, 8)
  if (d.length > 8) result += ' - ' + d.slice(8, 10)
  if (d.length > 10) result += '.' + d.slice(10, 12)
  if (d.length > 12) result += '.' + d.slice(12, 16)
  return result
}

export function parseDMYtoISO(dmy: string): string {
  const m = dmy.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return ''
  return `${m[3]}-${m[2]}-${m[1]}`
}

export function ISOtoDMY(iso: string): string {
  if (!iso) return ''
  const [yyyy, mm, dd] = iso.split('-')
  return `${dd}.${mm}.${yyyy}`
}

export function exportToExcel(orders: Order[], t: (key: string, opts?: Record<string, unknown>) => string) {
  const rows = orders.map((o, i) => ({
    [t('orders_excel_num')]:          i + 1,
    [t('orders_excel_number')]:       o.number,
    [t('orders_excel_pharmacy')]:     o.pharmacyName,
    [t('orders_excel_city')]:         o.pharmacyCity,
    [t('orders_excel_distributors')]: o.groups.map(g => g.distributorName).filter(Boolean).join(', ') || String(o.groups.length),
    [t('orders_excel_positions')]:    o.lineCount,
    [t('orders_excel_qty')]:          o.totalQty,
    [t('orders_excel_sum')]:          o.totalSum,
    [t('orders_excel_date')]:         formatDate(o.createdAt),
    [t('orders_excel_status')]:       t(`order_status_${o.status}`),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, t('orders_excel_sheet'))
  XLSX.writeFile(wb, t('orders_excel_file'))
}
