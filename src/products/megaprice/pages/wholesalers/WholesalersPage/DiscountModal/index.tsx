import { useState, useEffect, useRef } from 'react'
import { X, Percent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { Wholesaler } from '@/products/megaprice/mocks/wholesalers.mocks'

export function DiscountModal({ wholesaler, initialValue, onSave, onClose }: {
  wholesaler: Wholesaler
  initialValue: string
  onSave: (value: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEdit = wholesaler.discountPercent !== null

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onSave(value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [value, onClose, onSave])

  const parsed = parseFloat(value)
  // 0 — допустимое значение, означает «нет скидки» (на бэке = DELETE).
  const valid = value.trim() !== '' && !isNaN(parsed) && parsed >= 0 && parsed <= 99

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center"
      onClick={onClose}>
      <div className="w-full max-w-[360px] rounded-t-2xl bg-white shadow-2xl md:rounded-2xl dark:bg-[#111111] dark:border dark:border-gray-700"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isEdit ? t('ws_modal_edit_title') : t('ws_modal_add_title')}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-[#929292]">{wholesaler.name}</p>
          </div>
          <button onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-[#929292]">{t('ws_modal_discount_label')}</label>
          <p className="mb-1.5 text-[11px] text-gray-400 dark:text-[#929292]">
            Введите 0 чтобы убрать скидку
          </p>
          <div className={cn(
            'flex items-center rounded-xl border transition-colors',
            valid ? 'border-gray-300 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/20 dark:border-gray-600 dark:focus-within:border-blue-400'
                  : value ? 'border-red-300 focus-within:border-red-400' : 'border-gray-200 focus-within:border-gray-400 dark:border-gray-700',
          )}>
            <input
              ref={inputRef}
              type="number"
              min="0"
              max="99"
              step="0.5"
              placeholder={t('ws_modal_placeholder')}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="h-10 flex-1 rounded-xl bg-transparent pl-3 text-sm text-gray-900 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500"
            />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-400">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          {value && !valid && (
            <p className="mt-1.5 text-xs text-red-500">{t('ws_modal_invalid')}</p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <button onClick={onClose}
            className="ml-auto rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
            {t('ws_modal_cancel')}
          </button>
          <button
            onClick={() => valid && onSave(value)}
            disabled={!valid}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              valid
                ? 'bg-gray-900 text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-[#222222] dark:text-[#929292]',
            )}>
            {t('ws_modal_save')}
          </button>
        </div>
      </div>
    </div>
  )
}
