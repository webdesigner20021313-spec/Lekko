import { Fragment, useRef } from 'react'
import { ChevronDown, Package, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { CartItem } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { QtyControl } from '../QtyControl'
import type { DistGroup } from '../types'

/** Desktop-таблица всех групп + items + groupbar (cart). */
export function CartTable({
  groups,
  collapsed,
  checkedIds,
  effPrice,
  getDiscount,
  allChecked,
  someChecked,
  onToggleAll,
  onToggleCollapse,
  onToggleGroup,
  onToggleItem,
  onRemoveItem,
  onUpdateQty,
}: {
  groups: DistGroup[]
  collapsed: Set<string>
  checkedIds: Set<string>
  effPrice: (item: CartItem) => number
  getDiscount: (distributorId: string | number) => number | undefined
  allChecked: boolean
  someChecked: boolean
  onToggleAll: () => void
  onToggleCollapse: (id: string) => void
  onToggleGroup: (group: DistGroup) => void
  onToggleItem: (offerId: string) => void
  onRemoveItem: (offerId: string) => void
  onUpdateQty: (offerId: string, qty: number) => void
}) {
  const { t } = useTranslation()
  const cbRef = useRef<HTMLInputElement>(null)
  if (cbRef.current) cbRef.current.indeterminate = someChecked

  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 z-10 bg-white dark:bg-[#111111]">
        <tr className="h-12 border-b-2 border-gray-200 dark:border-gray-700">
          <th className="w-10 px-4 text-left">
            <input
              ref={cbRef}
              type="checkbox"
              checked={allChecked}
              onChange={onToggleAll}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
            />
          </th>
          <th className="px-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300" colSpan={5}>{t('cart_col_distributor')}</th>
          <th className="w-[150px] px-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{t('cart_col_sum')}</th>
          <th className="w-10 px-4" />
        </tr>
      </thead>

      <tbody>
        {groups.map(group => {
          const isCollapsed      = collapsed.has(group.id)
          const groupAllChecked  = group.items.every(i => checkedIds.has(i.offerId))
          const groupSomeChecked = group.items.some(i => checkedIds.has(i.offerId))
          const groupTotal       = group.items.reduce((s, i) => s + effPrice(i) * i.quantity, 0)
          const groupQtyTotal    = group.items.reduce((s, i) => s + i.quantity, 0)
          const discount         = getDiscount(Number(group.id))

          return (
            <Fragment key={group.id}>
              <tr className="border-t border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-[#222222]">
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={groupAllChecked}
                    ref={el => { if (el) el.indeterminate = groupSomeChecked && !groupAllChecked }}
                    onChange={() => onToggleGroup(group)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                  />
                </td>
                <td className="px-3 py-2.5" colSpan={5}>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group.name}</span>
                    {discount ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]">
                        персональная скидка −{discount}%
                      </span>
                    ) : null}
                    <span className="text-xs text-gray-500 dark:text-[#929292]">
                      {t('cart_group_info', { city: group.city, pos: group.items.length, qty: groupQtyTotal })}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-sm font-bold text-gray-800 dark:text-gray-200">
                  {formatCurrency(groupTotal)}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onToggleCollapse(group.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                  </button>
                </td>
              </tr>

              {!isCollapsed && (
                <tr className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
                  <td className="px-4 py-2" />
                  <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_name')}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_manufacturer')}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_country')}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_price')}</td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_qty')}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-[#929292]">{t('cart_col_total')}</td>
                  <td className="px-4 py-2" />
                </tr>
              )}
              {!isCollapsed && group.items.map(item => {
                const isChecked = checkedIds.has(item.offerId)
                const lineTotal = effPrice(item) * item.quantity

                return (
                  <tr
                    key={item.offerId}
                    className={cn(
                      'border-b border-gray-100 transition-colors duration-100 dark:border-[#333333]',
                      isChecked ? 'bg-gray-50 dark:bg-[#222222]' : 'bg-white hover:bg-gray-50 dark:bg-[#111111] dark:hover:bg-gray-800',
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleItem(item.offerId)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                      />
                    </td>

                    <td className="max-w-[220px] px-3 py-3">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.medicine.name}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      <span className="truncate text-sm text-gray-600 dark:text-gray-400">
                        {item.medicine.manufacturer}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {item.medicine.country}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right text-sm tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {formatCurrency(effPrice(item))}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <QtyControl
                          value={item.quantity}
                          onChange={v => v === 0 ? onRemoveItem(item.offerId) : onUpdateQty(item.offerId, v)}
                        />
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {formatCurrency(lineTotal)}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onRemoveItem(item.offerId)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        aria-label={t('cart_remove')}
                      >
                        <Trash2 className="h-[14px] w-[14px]" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
