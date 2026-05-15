import { AlertCircle, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDateTime } from '@/shared/utils/format'
import type { OrderItem, WholesalerProposal } from '@/products/megaprice/pages/orders/types'

export function ProposalBlock({
  proposal,
  onAccept,
  onReject,
  isBusy,
}: {
  proposal: WholesalerProposal
  /** Items этой группы — нужны для substitute/quantity/price (имя препарата). */
  items: OrderItem[]
  onAccept: () => void
  onReject: () => void
  isBusy?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 dark:border-[#78350F]/40 dark:bg-amber-900/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
          {t('orders_proposal_title') ?? 'Дистрибутор предложил изменения'}
        </p>
        <span className="text-xs text-amber-700/70 dark:text-amber-400/70">
          {formatDateTime(proposal.receivedAt)}
        </span>
      </div>

      <div className="space-y-2">
        {proposal.changes.map((change, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-amber-200 bg-white px-4 py-3 dark:border-[#78350F]/40 dark:bg-[#222222]"
          >
            <p className="text-xs font-medium text-gray-400 mb-1 dark:text-gray-500">
              {change.medicineName ??
                (change.type === 'substitute' ? String(change.oldValue) : '')}
            </p>

            {change.type === 'quantity' && (
              <p className="text-sm text-gray-900 dark:text-gray-200">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('orders_proposal_qty') ?? 'Количество:'}{' '}
                </span>
                <span className="font-medium line-through text-red-500">{change.oldValue}</span>
                <span className="mx-1.5 text-gray-400 dark:text-gray-500">→</span>
                <span className="font-semibold text-green-700 dark:text-green-400">{change.newValue}</span>
              </p>
            )}

            {change.type === 'price' && (
              <p className="text-sm text-gray-900 dark:text-gray-200">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('orders_proposal_price') ?? 'Цена:'}{' '}
                </span>
                <span className="font-medium line-through text-red-500">
                  {formatCurrency(Number(change.oldValue))}
                </span>
                <span className="mx-1.5 text-gray-400 dark:text-gray-500">→</span>
                <span className="font-semibold text-green-700 dark:text-green-400">
                  {formatCurrency(Number(change.newValue))}
                </span>
              </p>
            )}

            {change.type === 'substitute' && (
              <p className="text-sm text-gray-900 dark:text-gray-200">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('orders_proposal_substitute') ?? 'Замена на:'}{' '}
                </span>
                <span className="font-semibold text-green-700 dark:text-green-400">
                  {String(change.newValue)}
                </span>
                {change.newManufacturer && (
                  <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                    ({change.newManufacturer}{change.newCountry ? `, ${change.newCountry}` : ''})
                  </span>
                )}
              </p>
            )}

            {change.type === 'added' && (
              <p className="text-sm text-gray-900 dark:text-gray-200">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('orders_proposal_added') ?? 'Добавлено:'}{' '}
                </span>
                <span className="font-semibold text-green-700 dark:text-green-400">
                  {change.newValue} шт
                </span>
                {change.addedPrice ? (
                  <>
                    <span className="mx-1.5 text-gray-400">·</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {formatCurrency(change.addedPrice)} {t('orders_proposal_per_unit') ?? 'за шт'}
                    </span>
                  </>
                ) : null}
                {change.addedManufacturer && (
                  <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                    ({change.addedManufacturer}{change.addedCountry ? `, ${change.addedCountry}` : ''})
                  </span>
                )}
              </p>
            )}

            {change.type === 'removed' && (
              <p className="text-sm text-gray-900 dark:text-gray-200">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('orders_proposal_removed') ?? 'Удалено из заказа'}{' '}
                </span>
                {change.oldValue ? (
                  <span className="ml-1 font-medium line-through text-red-500">
                    {change.oldValue} шт
                  </span>
                ) : null}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onReject}
          disabled={isBusy}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t('orders_proposal_reject') ?? 'Отклонить'}
        </button>
        <button
          onClick={onAccept}
          disabled={isBusy}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50 dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
        >
          <Check className="h-3.5 w-3.5" />
          {t('orders_proposal_accept') ?? 'Принять изменения'}
        </button>
      </div>
    </div>
  )
}
