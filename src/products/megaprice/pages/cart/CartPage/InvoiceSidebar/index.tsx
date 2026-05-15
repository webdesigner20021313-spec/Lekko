import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/shared/utils/format'
import type { CartItem, Pharmacy } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { InvoiceGroup } from '../types'
import { PharmacyDropdown } from '../PharmacyDropdown'

/** Правая боковая панель инвойса (desktop, ≥md). */
export function InvoiceSidebar({
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
  const hasSelection = invoiceGroups.length > 0

  return (
    <div className="hidden md:flex w-[360px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
      <PharmacyDropdown
        pharmacy={pharmacy}
        pharmacyId={pharmacyId}
        show={showPharmacyDrop}
        setShow={setShowPharmacyDrop}
        onSelect={onSelectPharmacy}
      />

      {!hasSelection ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <Receipt className="h-7 w-7 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('cart_select_title')}</p>
          <p className="text-xs leading-relaxed text-gray-400 dark:text-[#929292]">{t('cart_select_hint')}</p>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 pt-4 pb-0">
              <p className="text-xs text-gray-400 mb-1 dark:text-gray-500">{t('cart_total_label')}</p>
              <p className="text-[28px] font-bold tabular-nums text-gray-900 leading-none dark:text-gray-100">{formatCurrency(invoiceTotal)}</p>
            </div>

            <div className="px-4 pb-3 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_positions')}</span>
                <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{invoiceItemCnt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_units')}</span>
                <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{invoiceQtyCnt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('cart_distributors')}</span>
                <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{invoiceGroups.length}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3">
              <p className="mb-2 text-xs font-semibold text-gray-900 dark:text-gray-100">{t('cart_order_content')}</p>
              <div className="space-y-3">
                {invoiceGroups.map(g => (
                  <div key={g.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-[#222222]">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">{g.name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-[#929292]">{g.city}</p>
                      </div>
                      <div className="ml-2 shrink-0 text-right">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{formatCurrency(g.subtotal)}</p>
                        <p className="text-[11px] text-gray-400 dark:text-[#929292]">{t('cart_group_pos_qty', { pos: g.items.length, qty: g.qty })}</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100 bg-white dark:divide-[#333333] dark:bg-[#111111]">
                      {g.items.map(item => (
                        <div key={item.offerId} className="flex items-center gap-2 px-3 py-1.5">
                          <p className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-400">
                            {item.medicine.name}
                          </p>
                          <span className="shrink-0 text-[11px] text-gray-400 dark:text-[#929292]">×{item.quantity}</span>
                          <span className="w-16 shrink-0 text-right text-xs font-medium text-gray-800 dark:text-gray-200">
                            {formatCurrency(effPrice(item) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#111111]">
            <button
              onClick={onCreateOrder}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
            >
              {t('cart_create_order')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
