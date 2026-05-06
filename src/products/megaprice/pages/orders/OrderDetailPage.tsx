import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, Wallet,
  Download, FileText, CheckCircle2, XCircle,
  MoreVertical, Mail, MessageCircle,
  AlertCircle, Check, X,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import logoSvgRaw from '@/assets/logos/megaprice-logo.svg?raw'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/format'
import { useOrdersStore } from '@/products/megaprice/stores/useOrdersStore'
import { mp } from '@/products/megaprice/utils/path'
import {
  ORDER_STATUS_CONFIG,
  DISTRIBUTOR_STATUS_CONFIG,
  type Order,
  type OrderStatus,
  type DistributorStatus,
  type OrderItem,
  type OrderDistributorGroup,
  type WholesalerProposal,
} from '@/products/megaprice/pages/orders/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { kind: 'complete' }
  | { kind: 'cancel_order' }

// ─── Download / Print helpers ─────────────────────────────────────────────────

function downloadGroupExcel(group: OrderDistributorGroup, orderNumber: string) {
  const rows = [
    ...group.items.map(item => ({
      'Препарат':      item.medicineName,
      'Производитель': item.manufacturer,
      'Страна':        item.country,
      'Кол-во':        item.quantity,
      'Цена с НДС':    item.priceWithVat,
      'Итого':         item.quantity * item.priceWithVat,
    })),
    {
      'Препарат':      'ИТОГО',
      'Производитель': '',
      'Страна':        '',
      'Кол-во':        group.items.reduce((s, i) => s + i.quantity, 0),
      'Цена с НДС':    0,
      'Итого':         group.subtotal,
    },
  ]
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Заказ')
  XLSX.writeFile(wb, `${orderNumber}_${group.distributorName}.xlsx`)
}

function downloadFullExcel(order: Order) {
  const rows: Record<string, string | number>[] = []
  for (const group of order.groups) {
    rows.push({ 'Дистрибутор': group.distributorName, 'Город': group.distributorCity, 'Препарат': '', 'Производитель': '', 'Страна': '', 'Кол-во': '', 'Цена с НДС': '', 'Итого': '' })
    for (const item of group.items) {
      rows.push({ 'Дистрибутор': '', 'Город': '', 'Препарат': item.medicineName, 'Производитель': item.manufacturer, 'Страна': item.country, 'Кол-во': item.quantity, 'Цена с НДС': item.priceWithVat, 'Итого': item.quantity * item.priceWithVat })
    }
    rows.push({ 'Дистрибутор': `Итого ${group.distributorName}`, 'Город': '', 'Препарат': '', 'Производитель': '', 'Страна': '', 'Кол-во': group.items.reduce((s, i) => s + i.quantity, 0), 'Цена с НДС': '', 'Итого': group.subtotal })
  }
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Заказ')
  XLSX.writeFile(wb, `${order.number}.xlsx`)
}

// ─── Logo as base64 data URI (original SVG file, no path errors) ─────────────
function getLogoImgHtml() {
  const b64 = btoa(unescape(encodeURIComponent(logoSvgRaw)))
  return `<img src="data:image/svg+xml;base64,${b64}" height="48" style="display:block;margin-bottom:6px;" alt="MegaPrice"/>`
}

// ─── Common print styles ──────────────────────────────────────────────────────
const PRINT_STYLES = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,Arial,sans-serif;color:#111827;padding:32px;font-size:13px;}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #111827;padding-bottom:16px;}.order-num{font-size:22px;font-weight:700;margin-top:8px;}.order-date{margin-top:3px;font-size:12px;color:#6b7280;}.meta{display:grid;gap:16px;margin-bottom:24px;padding:14px 16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;}.meta-item label{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:3px;}.meta-item .val{font-size:13px;font-weight:600;color:#111827;}.meta-item .sub{font-size:11px;color:#6b7280;margin-top:2px;}table{width:100%;border-collapse:collapse;margin-bottom:16px;}thead tr{background:#f9fafb;border-bottom:2px solid #e5e7eb;}th{padding:9px 12px;font-size:10px;font-weight:700;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.04em;}.dist-row td{padding:7px 12px;font-weight:700;font-size:12px;background:#f3f4f6;border-top:2px solid #e5e7eb;border-bottom:1px solid #e5e7eb;color:#374151;}.data-row td{padding:8px 12px;font-size:12px;border-bottom:1px solid #f3f4f6;}.subtotal-row td{padding:7px 12px;font-size:12px;border-top:1px solid #e5e7eb;background:#f9fafb;}.total-row td{padding:11px 12px;font-size:14px;font-weight:700;background:#111827;color:#fff;}@media print{body{padding:16px;}}`

function printGroupInvoice(group: OrderDistributorGroup, order: Order) {
  const win = window.open('', '_blank')
  if (!win) return
  const itemsHtml = group.items.map((item, idx) =>
    `<tr class="data-row" style="background:${idx % 2 === 1 ? '#f9fafb' : '#fff'}">
      <td>${item.medicineName}</td>
      <td style="color:#6b7280">${item.manufacturer}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${item.priceWithVat.toLocaleString('ru-RU')} UZS</td>
      <td style="text-align:right;font-weight:600">${(item.quantity * item.priceWithVat).toLocaleString('ru-RU')} UZS</td>
    </tr>`
  ).join('')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Инвойс ${order.number}</title><style>${PRINT_STYLES}</style></head><body>
    <div class="header">
      <div>
        ${getLogoImgHtml()}
        <div class="order-num">Инвойс ${order.number}</div>
        <div class="order-date">${formatDateTime(order.createdAt)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Статус</div>
        <div style="font-size:14px;font-weight:700">${ORDER_STATUS_CONFIG[order.status].label}</div>
      </div>
    </div>
    <div class="meta" style="grid-template-columns:1fr 1fr">
      <div class="meta-item">
        <label>Аптека</label>
        <div class="val">${order.pharmacyName}</div>
        <div class="sub">${order.pharmacyAddress}, ${order.pharmacyCity}</div>
      </div>
      <div class="meta-item">
        <label>Дистрибутор</label>
        <div class="val">${group.distributorName}</div>
        <div class="sub">${group.distributorCity} · ${group.contact}</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>Препарат</th><th>Производитель</th>
        <th style="text-align:center">Кол-во</th>
        <th style="text-align:right">Цена / шт</th>
        <th style="text-align:right">Итого</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr class="total-row">
        <td colspan="4" style="text-align:right">ИТОГО</td>
        <td style="text-align:right">${group.subtotal.toLocaleString('ru-RU')} UZS</td>
      </tr></tfoot>
    </table>
  </body></html>`)
  win.document.close()
  win.print()
}

function printFullInvoice(order: Order) {
  const win = window.open('', '_blank')
  if (!win) return
  const totalItems  = order.groups.reduce((s, g) => s + g.items.length, 0)
  const singleDist  = order.groups.length === 1 ? order.groups[0] : null
  const groupsHtml  = order.groups.map(group =>
    `<tr class="dist-row"><td colspan="5">${group.distributorName} — ${group.distributorCity}</td></tr>
     ${group.items.map((item, idx) =>
       `<tr class="data-row" style="background:${idx % 2 === 1 ? '#f9fafb' : '#fff'}">
         <td>${item.medicineName}</td>
         <td style="color:#6b7280">${item.manufacturer}</td>
         <td style="text-align:center">${item.quantity}</td>
         <td style="text-align:right">${item.priceWithVat.toLocaleString('ru-RU')} UZS</td>
         <td style="text-align:right;font-weight:600">${(item.quantity * item.priceWithVat).toLocaleString('ru-RU')} UZS</td>
       </tr>`
     ).join('')}
     ${order.groups.length > 1 ? `<tr class="subtotal-row"><td colspan="4" style="text-align:right;color:#6b7280">Итого ${group.distributorName}:</td><td style="text-align:right;font-weight:700">${group.subtotal.toLocaleString('ru-RU')} UZS</td></tr>` : ''}`
  ).join('')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Инвойс ${order.number}</title><style>${PRINT_STYLES}</style></head><body>
    <div class="header">
      <div>
        ${getLogoImgHtml()}
        <div class="order-num">Инвойс ${order.number}</div>
        <div class="order-date">${formatDateTime(order.createdAt)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Статус</div>
        <div style="font-size:14px;font-weight:700">${ORDER_STATUS_CONFIG[order.status].label}</div>
      </div>
    </div>
    <div class="meta" style="grid-template-columns:${singleDist ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr'}">
      <div class="meta-item">
        <label>Аптека</label>
        <div class="val">${order.pharmacyName}</div>
        <div class="sub">${order.pharmacyAddress}, ${order.pharmacyCity}</div>
      </div>
      ${singleDist ? `<div class="meta-item"><label>Дистрибутор</label><div class="val">${singleDist.distributorName}</div><div class="sub">${singleDist.distributorCity} · ${singleDist.contact}</div></div>` : ''}
      <div class="meta-item">
        <label>Позиций / Единиц</label>
        <div class="val">${totalItems} поз. / ${order.totalQty} ед.</div>
      </div>
      <div class="meta-item">
        <label>Сумма заказа</label>
        <div class="val" style="font-size:15px">${order.totalSum.toLocaleString('ru-RU')} UZS</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>Препарат</th><th>Производитель</th>
        <th style="text-align:center">Кол-во</th>
        <th style="text-align:right">Цена / шт</th>
        <th style="text-align:right">Итого</th>
      </tr></thead>
      <tbody>${groupsHtml}</tbody>
      <tfoot><tr class="total-row">
        <td colspan="4" style="text-align:right">ИТОГО</td>
        <td style="text-align:right">${order.totalSum.toLocaleString('ru-RU')} UZS</td>
      </tr></tfoot>
    </table>
  </body></html>`)
  win.document.close()
  win.print()
}

// ─── Global Status Badge ──────────────────────────────────────────────────────

function GlobalStatusBadge({ status }: { status: OrderStatus }) {
  const { label, bg, text } = ORDER_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-medium', bg, text)}>
      {label}
    </span>
  )
}

// ─── Distributor Status Badge ─────────────────────────────────────────────────

function DistributorStatusBadge({ status }: { status: DistributorStatus }) {
  const { label, bg, text } = DISTRIBUTOR_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', bg, text)}>
      {label}
    </span>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  description,
  confirmLabel,
  isDanger = false,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  confirmLabel: string
  isDanger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Назад
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors',
              isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-black',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Proposal Block ───────────────────────────────────────────────────────────

function ProposalBlock({
  proposal,
  items,
  onAccept,
  onReject,
}: {
  proposal: WholesalerProposal
  items: OrderItem[]
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-amber-900">Дистрибутор предложил изменения</p>
            <span className="text-xs text-amber-600">{formatDateTime(proposal.receivedAt)}</span>
          </div>

          <div className="mt-3 space-y-2">
            {proposal.changes.map((change, idx) => {
              const item = items.find(i => i.id === change.itemId)
              return (
                <div key={idx} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5">
                  <p className="text-xs font-medium text-gray-400 mb-1">
                    {change.type === 'substitute' ? String(change.oldValue) : item?.medicineName}
                  </p>
                  {change.type === 'quantity' && (
                    <p className="text-sm text-gray-900">
                      Количество:{' '}
                      <span className="font-medium line-through text-red-400">{change.oldValue}</span>
                      <span className="mx-1.5 text-gray-400">→</span>
                      <span className="font-semibold text-green-700">{change.newValue}</span>
                    </p>
                  )}
                  {change.type === 'price' && (
                    <p className="text-sm text-gray-900">
                      Цена:{' '}
                      <span className="font-medium line-through text-red-400">{formatCurrency(Number(change.oldValue))}</span>
                      <span className="mx-1.5 text-gray-400">→</span>
                      <span className="font-semibold text-green-700">{formatCurrency(Number(change.newValue))}</span>
                    </p>
                  )}
                  {change.type === 'substitute' && (
                    <p className="text-sm text-gray-900">
                      Замена:{' '}
                      <span className="font-semibold text-green-700">{String(change.newValue)}</span>
                      {change.newManufacturer && (
                        <span className="ml-1.5 text-xs text-gray-500">
                          ({change.newManufacturer}{change.newCountry ? `, ${change.newCountry}` : ''})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={onReject}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Отклонить
            </button>
            <button
              onClick={onAccept}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              <Check className="h-3.5 w-3.5" />
              Принять изменения
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Distributor Card ─────────────────────────────────────────────────────────

function DistributorCard({
  group,
  isOrderActive,
  onCancelOrder,
  onAcceptProposal,
  onRejectProposal,
  onDownloadExcel,
  onPrintInvoice,
}: {
  group: OrderDistributorGroup
  isOrderActive: boolean
  onCancelOrder: () => void
  onAcceptProposal: () => void
  onRejectProposal: () => void
  onDownloadExcel: () => void
  onPrintInvoice: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const isCancelled = group.distributorStatus === 'cancelled'
  const hasOffer    = group.distributorStatus === 'offer'
  const totalQty    = group.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border border-gray-200 bg-white',
      isCancelled && 'opacity-60',
    )}>

      {/* ── Card header ── */}
      <div className="flex items-start gap-4 border-b border-gray-200 bg-gray-50 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{group.distributorName}</p>
            <span className="text-xs text-gray-400">{group.distributorCity}</span>
            <DistributorStatusBadge status={group.distributorStatus} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {group.contactType === 'telegram'
              ? <MessageCircle className="h-3 w-3 text-[#1E40AF]" />
              : <Mail className="h-3 w-3 text-gray-400" />
            }
            <span className="text-xs text-gray-500">{group.contact}</span>
            {group.sentAt && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">Отправлен {formatDate(group.sentAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(m => !m)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => { onDownloadExcel(); setShowMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 text-gray-400" />
                  Скачать Excel
                </button>
                <button
                  onClick={() => { onPrintInvoice(); setShowMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  Скачать Invoice
                </button>
                {isOrderActive && !isCancelled && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => { onCancelOrder(); setShowMenu(false) }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 text-red-400" />
                      Отменить заказ
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Proposal ── */}
      {hasOffer && group.proposal && (
        <ProposalBlock
          proposal={group.proposal}
          items={group.items}
          onAccept={onAcceptProposal}
          onReject={onRejectProposal}
        />
      )}

      {/* ── Items table ── */}
      <div className="overflow-x-auto">
        {group.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Нет товаров</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Препарат</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Производитель</th>
                <th className="px-5 py-2.5 text-center text-xs font-semibold text-gray-500">Кол-во</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500">Цена / шт</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500">Итого</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map(item => (
                <tr key={item.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{item.medicineName}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-600">{item.manufacturer}</p>
                    <p className="text-xs text-gray-400">{item.country}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm text-gray-600">{formatCurrency(item.priceWithVat)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.quantity * item.priceWithVat)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Card footer ── */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3.5">
        <span className="text-sm text-gray-500">
          {isCancelled ? (
            <span className="text-red-400">Отменён</span>
          ) : (
            `${totalQty} ед. · ${group.items.length} поз.`
          )}
        </span>
        <span className={cn('text-base font-bold', isCancelled ? 'text-gray-300 line-through' : 'text-gray-900')}>
          {formatCurrency(group.subtotal)}
        </span>
      </div>
    </div>
  )
}

// ─── Order Detail Page (entry) ────────────────────────────────────────────────

export function OrderDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orders   = useOrdersStore(s => s.orders)

  const rawOrder = orders.find(o => o.id === id)

  if (!rawOrder) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white">
        <p className="text-sm font-semibold text-gray-900">Заказ не найден</p>
        <button
          onClick={() => navigate(mp('/orders'))}
          className="mt-3 text-sm text-gray-500 underline hover:text-gray-700"
        >
          Вернуться к списку
        </button>
      </div>
    )
  }

  return <OrderDetailContent key={rawOrder.id} order={rawOrder} />
}

// ─── Order Detail Content ─────────────────────────────────────────────────────

function OrderDetailContent({ order: initialOrder }: { order: Order }) {
  const navigate      = useNavigate()
  const updateOrder   = useOrdersStore(s => s.updateOrder)

  const [order, setOrder] = useState<Order>(initialOrder)
  const [modal, setModal] = useState<ModalState | null>(null)

  const isOrderActive = order.status === 'new' || order.status === 'modified'
  const totalItems    = order.groups.reduce((s, g) => s + g.items.length, 0)
  const hasProposals  = order.groups.some(g => g.distributorStatus === 'offer')

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function recalcTotals(groups: OrderDistributorGroup[]) {
    const active = groups.filter(g => g.distributorStatus !== 'cancelled')
    return {
      totalSum: active.reduce((s, g) => s + g.subtotal, 0),
      totalQty: active.reduce((s, g) => s + g.items.reduce((qs, i) => qs + i.quantity, 0), 0),
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleAcceptProposal(distributorId: string) {
    const group = order.groups.find(g => g.distributorId === distributorId)
    if (!group?.proposal) return

    let updatedItems = [...group.items]
    for (const change of group.proposal.changes) {
      if (change.type === 'quantity') {
        updatedItems = updatedItems.map(i =>
          i.id === change.itemId ? { ...i, quantity: Number(change.newValue) } : i
        )
      } else if (change.type === 'price') {
        updatedItems = updatedItems.map(i =>
          i.id === change.itemId ? { ...i, priceWithVat: Number(change.newValue) } : i
        )
      } else if (change.type === 'substitute') {
        updatedItems = updatedItems.map(i =>
          i.id === change.itemId ? {
            ...i,
            medicineName: String(change.newValue),
            manufacturer: change.newManufacturer ?? i.manufacturer,
            country:      change.newCountry ?? i.country,
          } : i
        )
      }
    }
    const newSubtotal = updatedItems.reduce((s, i) => s + i.quantity * i.priceWithVat, 0)
    const updatedGroups = order.groups.map(g =>
      g.distributorId === distributorId
        ? { ...g, items: updatedItems, subtotal: newSubtotal, distributorStatus: 'accepted' as DistributorStatus, proposal: undefined }
        : g
    )
    const stillHasOffers = updatedGroups.some(g => g.distributorStatus === 'offer')
    const next = {
      ...order,
      groups: updatedGroups,
      ...recalcTotals(updatedGroups),
      ...(order.status === 'modified' && !stillHasOffers ? { status: 'new' as OrderStatus } : {}),
    }
    setOrder(next)
    updateOrder(next)
  }

  function handleRejectProposal(distributorId: string) {
    const updatedGroups = order.groups.map(g =>
      g.distributorId === distributorId
        ? { ...g, distributorStatus: 'cancelled' as DistributorStatus }
        : g
    )
    const allCancelled   = updatedGroups.every(g => g.distributorStatus === 'cancelled')
    const stillHasOffers = updatedGroups.some(g => g.distributorStatus === 'offer')
    const next = {
      ...order,
      groups: updatedGroups,
      ...recalcTotals(updatedGroups),
      status: (allCancelled
        ? 'cancelled'
        : (order.status === 'modified' && !stillHasOffers ? 'new' : order.status)) as OrderStatus,
    }
    setOrder(next)
    updateOrder(next)
  }

  function handleCompleteOrder() {
    const next = { ...order, status: 'completed' as OrderStatus }
    setOrder(next)
    updateOrder(next)
  }

  function handleCancelOrder() {
    const updatedGroups = order.groups.map(g => ({
      ...g,
      distributorStatus: 'cancelled' as DistributorStatus,
    }))
    const next = { ...order, status: 'cancelled' as OrderStatus, groups: updatedGroups }
    setOrder(next)
    updateOrder(next)
  }

  // ── Info card ────────────────────────────────────────────────────────────────

  function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(mp('/orders'))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <h1 className="font-mono text-xl font-bold text-gray-900">{order.number}</h1>
            <GlobalStatusBadge status={order.status} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => printFullInvoice(order)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Инвойс</span>
            </button>
            <button
              onClick={() => downloadFullExcel(order)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:border-green-700 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={cn('min-h-0 flex-1 overflow-y-auto bg-gray-50/40 px-6 py-5', isOrderActive && 'pb-24')}>
        <div className="mx-auto max-w-4xl space-y-4">

          {/* Info cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoCard
              icon={<MapPin className="h-4 w-4" />}
              label="Аптека"
              value={order.pharmacyName}
              sub={`${order.pharmacyAddress}, ${order.pharmacyCity}`}
            />
            <InfoCard
              icon={<Calendar className="h-4 w-4" />}
              label="Дата создания"
              value={formatDateTime(order.createdAt)}
              sub={`${order.groups.length} ${order.groups.length === 1 ? 'дистрибутор' : 'дистрибутора'}`}
            />
            <InfoCard
              icon={<Wallet className="h-4 w-4" />}
              label="Итого"
              value={formatCurrency(order.totalSum)}
              sub={`${order.totalQty} ед. · ${totalItems} поз.`}
            />
          </div>

          {/* Proposals banner */}
          {hasProposals && isOrderActive && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                {order.groups.filter(g => g.distributorStatus === 'offer').length === 1
                  ? 'Один дистрибутор прислал предложение — рассмотрите его ниже'
                  : `${order.groups.filter(g => g.distributorStatus === 'offer').length} дистрибутора прислали предложения — рассмотрите их ниже`
                }
              </p>
            </div>
          )}

          {/* Completed / Cancelled state */}
          {order.status === 'completed' && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm font-medium text-green-700">Заказ завершён</p>
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-600">Заказ отменён</p>
            </div>
          )}

          {/* Distributor cards */}
          {order.groups.map(group => (
            <DistributorCard
              key={group.distributorId}
              group={group}
              isOrderActive={isOrderActive}
              onCancelOrder={() => setModal({ kind: 'cancel_order' })}
              onAcceptProposal={() => handleAcceptProposal(group.distributorId)}
              onRejectProposal={() => handleRejectProposal(group.distributorId)}
              onDownloadExcel={() => downloadGroupExcel(group, order.number)}
              onPrintInvoice={() => printGroupInvoice(group, order)}
            />
          ))}

        </div>
      </div>

      {/* ── Fixed bottom-right action bar ── */}
      {isOrderActive && (
        <div className="fixed bottom-0 left-[140px] right-0 z-40 flex items-center justify-end gap-4 border-t border-gray-200 bg-white px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button
            onClick={() => setModal({ kind: 'cancel_order' })}
            className="flex h-9 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            <X className="h-4 w-4" />
            Отменить
          </button>
          <button
            onClick={() => setModal({ kind: 'complete' })}
            className="flex h-9 items-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            <Check className="h-4 w-4" />
            Завершить
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.kind === 'complete' && (
        <ConfirmModal
          title="Завершить заказ?"
          description="Заказ будет переведён в статус «Завершён». Дальнейшее редактирование будет недоступно."
          confirmLabel="Завершить"
          onConfirm={handleCompleteOrder}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'cancel_order' && (
        <ConfirmModal
          title="Отменить заказ?"
          description="Заказ и все дистрибуторы будут отмечены как отменённые."
          confirmLabel="Отменить заказ"
          isDanger
          onConfirm={handleCancelOrder}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
