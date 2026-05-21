import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/shared/utils/format'
import { BottomSheet } from '@/shared/ui-kit/BottomSheet'
import type { CartItem, Pharmacy } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { InvoiceGroup } from '../types'
import { PharmacyDropdown } from '../PharmacyDropdown'

/** Mobile BottomSheet с инвойсом. */
export function InvoiceSheet({
  open,
  onClose,
  pharmacy,
  pharmacyId,
  onSelectPharmacy,
  invoiceGroups,
  invoiceTotal,
  invoiceItemCnt,
  invoiceQtyCnt,
  effPrice,
  onCreateOrder,
}: {
  open: boolean
  onClose: () => void
  pharmacy: Pharmacy
  pharmacyId: string
  onSelectPharmacy: (id: string) => void
  invoiceGroups: InvoiceGroup[]
  invoiceTotal: number
  invoiceItemCnt: number
  invoiceQtyCnt: number
  effPrice: (item: CartItem) => number
  onCreateOrder: () => void
}) {
  const { t } = useTranslation()
  const [showPharmacyDrop, setShowPharmacyDrop] = useState(false)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('cart_order_content')}
      maxHeight="92vh"
      footer={
        <div>
          <div className="mb-3 flex items-end justify-between">
            <span className="text-xs text-gray-400 dark:text-[#929292]">{t('cart_total_label')}</span>
            <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(invoiceTotal)}</span>
          </div>
          <button
            onClick={() => { onClose(); onCreateOrder() }}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900"
          >
            {t('cart_create_order')}
          </button>
        </div>
      }
    >
      <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
        <PharmacyDropdown
          inline
          pharmacy={pharmacy}
          pharmacyId={pharmacyId}
          show={showPharmacyDrop}
          setShow={setShowPharmacyDrop}
          onSelect={onSelectPharmacy}
        />
      </div>

      <div className="px-5 py-3">
        <div className="space-y-3">
          {invoiceGroups.map(g => (
            <div key={g.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{g.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#929292]">{g.city}</p>
                </div>
                <div className="ml-2 shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(g.subtotal)}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#929292]">{t('cart_group_pos_qty', { pos: g.items.length, qty: g.qty })}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100 bg-white dark:divide-[#333333] dark:bg-[#111111]">
                {g.items.map(item => (
                  <div key={item.offerId} className="flex items-center gap-2 px-3 py-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">{item.medicine.name}</p>
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-[#929292]">×{item.quantity}</span>
                    <span className="w-20 shrink-0 text-right text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(effPrice(item) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-gray-50 px-4 py-3 dark:bg-[#222222]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_positions')}</span>
            <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{invoiceItemCnt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_units')}</span>
            <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{invoiceQtyCnt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_distributors')}</span>
            <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{invoiceGroups.length}</span>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
