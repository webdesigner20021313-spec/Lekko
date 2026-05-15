import { ChevronDown, Package, Trash2 } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import type { CartItem } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { QtyControl } from '../QtyControl'
import type { DistGroup } from '../types'

export function CartGroupCardMobile({
  group,
  isCollapsed,
  checkedIds,
  effPrice,
  getDiscount,
  onToggleCollapse,
  onToggleGroup,
  onToggleItem,
  onRemoveItem,
  onUpdateQty,
}: {
  group: DistGroup
  isCollapsed: boolean
  checkedIds: Set<string>
  effPrice: (item: CartItem) => number
  getDiscount: (distributorId: string | number) => number | undefined
  onToggleCollapse: (id: string) => void
  onToggleGroup: (group: DistGroup) => void
  onToggleItem: (offerId: string) => void
  onRemoveItem: (offerId: string) => void
  onUpdateQty: (offerId: string, qty: number) => void
}) {
  const groupAllChecked  = group.items.every(i => checkedIds.has(i.offerId))
  const groupSomeChecked = group.items.some(i => checkedIds.has(i.offerId))
  const groupTotal       = group.items.reduce((s, i) => s + effPrice(i) * i.quantity, 0)
  const discount         = getDiscount(Number(group.id))

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <input
          type="checkbox"
          checked={groupAllChecked}
          ref={el => { if (el) el.indeterminate = groupSomeChecked && !groupAllChecked }}
          onChange={() => onToggleGroup(group)}
          className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-gray-900"
        />
        <button
          onClick={() => onToggleCollapse(group.id)}
          className="flex flex-1 items-center justify-between text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{group.name}</p>
            </div>
            {discount ? (
              <p className="mt-0.5 text-[10px] font-semibold text-green-700 dark:text-[#6EE7B7]">
                персональная скидка −{discount}%
              </p>
            ) : null}
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-[#929292]">
              {group.city} · {group.items.length} поз.
            </p>
          </div>
          <div className="ml-2 shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(groupTotal)}</p>
          </div>
          <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200', isCollapsed && '-rotate-90')} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="divide-y divide-gray-100 dark:divide-[#333333]">
          {group.items.map(item => {
            const isChecked = checkedIds.has(item.offerId)
            const lineTotal = effPrice(item) * item.quantity

            return (
              <div key={item.offerId} className={cn('flex gap-3 px-4 py-3', isChecked && 'bg-gray-50 dark:bg-[#222222]')}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleItem(item.offerId)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.medicine.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">{item.medicine.manufacturer}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {item.medicine.country}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#929292]">{formatCurrency(effPrice(item))}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <QtyControl
                      value={item.quantity}
                      onChange={v => v === 0 ? onRemoveItem(item.offerId) : onUpdateQty(item.offerId, v)}
                    />
                    <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(lineTotal)}</span>
                    <button
                      onClick={() => onRemoveItem(item.offerId)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 active:bg-red-50 active:text-red-500 dark:active:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
