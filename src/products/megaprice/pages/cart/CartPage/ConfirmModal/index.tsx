import { Receipt, ArrowRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { ConfirmPayload } from '../types'

export function ConfirmModal({
  payload,
  onConfirm,
  onClose,
  isLoading,
}: {
  payload: ConfirmPayload
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}) {
  const { t } = useTranslation()
  const totalSum = payload.groups.reduce((s, g) => s + g.subtotal, 0)
  const totalItems = payload.groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#111111] dark:border dark:border-gray-700">

        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label={t('cart_close')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#222222]">
            <Receipt className="h-7 w-7 text-gray-700 dark:text-gray-300" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('cart_success_title')}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-[#929292]">{t('cart_confirm_hint')}</p>
          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-[#929292]">{payload.pharmacy.name}</p>
        </div>

        <div className="px-6 pb-4">
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:divide-[#333333] dark:border-gray-700 dark:bg-[#222222]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500 dark:text-[#929292]">{t('cart_success_order_sum')}</span>
              <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(totalSum)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500 dark:text-[#929292]">{t('cart_success_positions')}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{totalItems}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-[1fr_auto] border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-[#222222]">
              <span className="text-xs font-semibold text-gray-400 dark:text-[#929292]">{t('cart_success_dist_col')}</span>
              <span className="text-xs font-semibold text-gray-400 dark:text-[#929292]">{t('cart_success_pos_col')}</span>
            </div>
            {payload.groups.map((group, idx) => (
              <div
                key={group.id}
                className={cn('grid grid-cols-[1fr_auto] items-center bg-white px-4 py-3 dark:bg-[#111111]', idx !== payload.groups.length - 1 && 'border-b border-gray-100 dark:border-[#333333]')}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{group.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-[#929292]">{group.city}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{group.items.length}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('cart_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('cart_placing')}
              </>
            ) : (
              <>
                {t('cart_done')} <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
