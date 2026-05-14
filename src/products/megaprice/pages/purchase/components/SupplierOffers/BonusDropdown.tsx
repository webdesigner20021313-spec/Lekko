import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { BonusType } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface Props {
  value: BonusType[]
  onChange: (next: BonusType[]) => void
}

/**
 * Локальный (не серверный) фильтр по типу бонуса. Бэк не возвращает bonus-метаданные —
 * фильтрация на фронте по тому, что пришло в офферах (см. SupplierOffers).
 */
export function BonusDropdown({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const options: { value: BonusType; label: string }[] = [
    { value: 'cashback',      label: t('bonus_cashback')      },
    { value: 'gift',          label: t('bonus_gift')          },
    { value: 'free_delivery', label: t('bonus_free_delivery') },
    { value: 'discount',      label: t('bonus_discount')      },
  ]

  function toggle(v: BonusType) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-[200px] items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
          open
            ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-[#222222] dark:text-gray-100'
            : value.length
              ? 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-200'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
        )}
      >
        <span className="flex-1 truncate text-left">
          {value.length ? `${t('filter_bonuses')} · ${value.length}` : t('filter_bonuses')}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-[200px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]">
            {t('filter_bonuses')}
          </p>
          {options.map((opt) => {
            const checked = value.includes(opt.value)
            return (
              <label
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className={cn(
                  'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                  checked
                    ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                    : 'border-gray-300 dark:border-gray-600',
                )}>
                  {checked && <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />}
                </div>
                <span className="truncate text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            )
          })}
          {value.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 dark:border-[#333333]">
              <button onClick={() => onChange([])} className="text-xs text-gray-400 hover:text-gray-600">
                Сбросить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
