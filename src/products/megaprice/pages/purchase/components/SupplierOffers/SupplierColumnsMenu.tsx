import { useEffect, useRef, useState } from 'react'
import { AlignJustify, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { ColumnKey } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface Props {
  visibleColumns: Record<ColumnKey, boolean>
  onToggleColumn: (key: ColumnKey) => void
}

/** Меню «показать/скрыть колонки» для таблицы офферов. */
export function SupplierColumnsMenu({ visibleColumns, onToggleColumn }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const options: { key: ColumnKey; label: string }[] = [
    { key: 'expiry',   label: t('col_expiry')    },
    { key: 'payment',  label: t('col_payment')   },
    { key: 'price',    label: t('col_price_vat') },
    { key: 'bonus',    label: t('filter_bonuses') },
    { key: 'quantity', label: t('col_quantity')  },
  ]

  return (
    <div ref={ref} className="relative ml-auto hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
          open
            ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-400 dark:bg-gray-700'
            : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
        )}
      >
        <AlignJustify className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">
            {t('filter_columns_header')}
          </p>
          {options.map((col) => {
            const checked = visibleColumns[col.key]
            return (
              <label
                key={col.key}
                onClick={() => onToggleColumn(col.key)}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className={cn(
                  'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                  checked
                    ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                    : 'border-gray-300 dark:border-gray-600'
                )}>
                  {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
