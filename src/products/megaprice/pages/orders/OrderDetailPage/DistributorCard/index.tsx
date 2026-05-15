import { useState } from 'react'
import {
  Download, FileText, XCircle, MoreVertical,
  Mail, MessageCircle, History as HistoryIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import type { OrderDistributorGroup } from '@/products/megaprice/pages/orders/types'
import { DistributorStatusBadge } from '../DistributorStatusBadge'
import { ProposalBlock } from '../ProposalBlock'

export function DistributorCard({
  group,
  isOrderActive,
  discountPercent,
  onCancelOrder,
  onAcceptProposal,
  onRejectProposal,
  onDownloadExcel,
  onDownloadPdf,
  onOpenHistory,
  isBusy,
}: {
  group: OrderDistributorGroup
  isOrderActive: boolean
  /** Персональная скидка аптеки у этого дистра в %. null/0 — нет. */
  discountPercent?: number | null
  onCancelOrder: () => void
  onAcceptProposal: () => void
  onRejectProposal: () => void
  onDownloadExcel: () => void
  onDownloadPdf: () => void
  onOpenHistory: () => void
  isBusy?: boolean
}) {
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)

  const isCancelled = group.distributorStatus === 'cancelled'
  const isAccepted  = group.distributorStatus === 'accepted'
  const hasOffer    = group.distributorStatus === 'offer'
  const canCancel   = isOrderActive && !isCancelled && !isAccepted
                      && group.distributorStatus !== 'rejected'
  const totalQty    = group.items.reduce((s, i) => s + i.quantity, 0)

  // Скидка
  const hasDiscount = (discountPercent ?? 0) > 0
  const dpct = discountPercent ?? 0
  const effPrice = (price: number) =>
    hasDiscount ? Math.round(price * (1 - dpct / 100)) : price
  // Subtotal с учётом скидки. Не используем group.subtotal — там сырой priceWithVat.
  const subtotalWithDiscount = group.items.reduce(
    (s, i) => s + i.quantity * effPrice(i.priceWithVat),
    0,
  )

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]',
      isCancelled && 'opacity-60',
    )}>

      {/* ── Card header ── */}
      <div className="flex items-start gap-4 border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-[#222222]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{group.distributorName}</p>
            <span className="text-xs text-gray-400 dark:text-[#929292]">{group.distributorCity}</span>
            <DistributorStatusBadge status={group.distributorStatus} />
            {hasDiscount && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900">
                −{dpct}% скидка
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {group.contactType === 'telegram'
              ? <MessageCircle className="h-3 w-3 text-[#1E40AF] dark:text-blue-400" />
              : <Mail className="h-3 w-3 text-gray-400" />
            }
            <span className="text-xs text-gray-500 dark:text-[#929292]">{group.contact}</span>
            {group.sentAt && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-xs text-gray-400 dark:text-[#929292]">{t('orders_sent_date', { date: formatDate(group.sentAt) })}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(m => !m)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-white dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
                <button
                  onClick={() => { onDownloadExcel(); setShowMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Download className="h-4 w-4 text-gray-400 dark:text-[#929292]" />
                  {t('orders_dl_excel')}
                </button>
                <button
                  onClick={() => { onDownloadPdf(); setShowMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <FileText className="h-4 w-4 text-gray-400 dark:text-[#929292]" />
                  {t('orders_dl_invoice')}
                </button>
                {group.distributorOrderId && (
                  <button
                    onClick={() => { onOpenHistory(); setShowMenu(false) }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <HistoryIcon className="h-4 w-4 text-gray-400 dark:text-[#929292]" />
                    {t('orders_history_menu') ?? 'История изменений'}
                  </button>
                )}
                {canCancel && (
                  <>
                    <div className="my-1 border-t border-gray-100 dark:border-[#333333]" />
                    <button
                      onClick={() => { onCancelOrder(); setShowMenu(false) }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="h-4 w-4 text-red-400" />
                      {t('orders_cancel_dist')}
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
          isBusy={isBusy}
        />
      )}

      {/* ── Items list ── */}
      <div>
        {group.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">{t('orders_no_items')}</div>
        ) : (
          <>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-[#333333]">
            {group.items.map(item => {
              const eff = effPrice(item.priceWithVat)
              return (
                <div key={item.id} className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.medicineName}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">{item.manufacturer} · {item.country}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-[#929292]">{item.quantity} ×</span>
                      {hasDiscount ? (
                        <>
                          <span className="text-gray-400 line-through dark:text-[#929292]">{formatCurrency(item.priceWithVat)}</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(eff)}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-[#929292]">{formatCurrency(item.priceWithVat)}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.quantity * eff)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 dark:border-gray-700 dark:bg-[#222222]">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('orders_col_medicine')}</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('orders_col_manufacturer')}</th>
                  <th className="px-5 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('orders_col_qty')}</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('orders_col_price_per')}</th>
                  {hasDiscount && (
                    <th className="px-5 py-2.5 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">Скидка</th>
                  )}
                  {hasDiscount && (
                    <th className="px-5 py-2.5 text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400">Со скидкой</th>
                  )}
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('orders_col_total')}</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map(item => {
                  const eff = effPrice(item.priceWithVat)
                  return (
                    <tr key={item.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50 dark:border-[#333333] dark:hover:bg-gray-800">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.medicineName}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.manufacturer}</p>
                        <p className="text-xs text-gray-400 dark:text-[#929292]">{item.country}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={cn(
                          'text-sm',
                          hasDiscount ? 'text-gray-400 line-through dark:text-[#929292]' : 'text-gray-600 dark:text-gray-400',
                        )}>{formatCurrency(item.priceWithVat)}</span>
                      </td>
                      {hasDiscount && (
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">−{dpct}%</span>
                        </td>
                      )}
                      {hasDiscount && (
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(eff)}</span>
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.quantity * eff)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* ── Card footer ── */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3.5 dark:border-gray-700 dark:bg-[#222222]">
        <span className="text-sm text-gray-500 dark:text-[#929292]">
          {isCancelled ? (
            <span className="text-red-400">{t('orders_cancelled_label')}</span>
          ) : (
            t('orders_dist_units_pos', { qty: totalQty, pos: group.items.length })
          )}
        </span>
        <div className="flex items-baseline gap-2.5">
          {hasDiscount && !isCancelled && (
            <span className="text-xs text-gray-400 line-through dark:text-[#929292]">
              {formatCurrency(group.subtotal)}
            </span>
          )}
          <span className={cn(
            'text-base font-bold',
            isCancelled ? 'text-gray-300 line-through dark:text-gray-600'
              : hasDiscount ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-gray-900 dark:text-gray-100',
          )}>
            {formatCurrency(isCancelled ? group.subtotal : subtotalWithDiscount)}
          </span>
        </div>
      </div>
    </div>
  )
}
