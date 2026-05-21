import type { RefObject } from 'react'
import { X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'

/** Шаг 4 — список загруженных позиций со статусами matched/unmatched. */
export function ResultsStep({
  medicines,
  selectedId,
  onSelect,
  checkedIds,
  onToggleCheck,
  cartQtyByDrugId,
  unmatchedIds,
  fileName,
  matchedCount,
  unmatchedCount,
  inputRef,
  onChangeMapping,
  onClear,
  onFile,
}: {
  medicines: Medicine[]
  selectedId: string | null
  onSelect: (m: Medicine) => void
  checkedIds: string[]
  onToggleCheck: (id: string) => void
  cartQtyByDrugId: Record<number, number>
  unmatchedIds: Set<string>
  fileName: string
  matchedCount: number
  unmatchedCount: number
  inputRef: RefObject<HTMLInputElement | null>
  onChangeMapping: () => void
  onClear: () => void
  onFile: (f: File | undefined) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Summary bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="max-w-[160px] truncate text-xs font-medium text-gray-700 dark:text-gray-300" title={fileName}>{fileName}</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs font-medium text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]">
            {t('excel_found_count', { count: matchedCount })}
          </span>
          {unmatchedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]">
              <AlertTriangle className="h-3 w-3" />
              {t('excel_not_found_count', { count: unmatchedCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onChangeMapping} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20">
            {t('excel_change')}
          </button>
          <button onClick={onClear} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-800">
            <X className="h-3.5 w-3.5" /> {t('excel_clear')}
          </button>
        </div>
      </div>

      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2.5 border-b border-[#FEF3C7] bg-[#FFFBEB] px-4 py-2.5 dark:border-[#78350F]/40 dark:bg-[#78350F]/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
          <p className="text-xs text-[#92400E] dark:text-[#FCD34D]">
            {unmatchedCount === 1
              ? t('excel_unmatched_1', { count: unmatchedCount })
              : t('excel_unmatched_many', { count: unmatchedCount })}
          </p>
        </div>
      )}

      {/* Medicine list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#333333]">
        {medicines.map(medicine => {
          const isSelected  = medicine.id === selectedId
          const isChecked   = checkedIds.includes(medicine.id)
          const cartQty     = (medicine.drugId != null ? cartQtyByDrugId[medicine.drugId] : 0) ?? 0
          const isUnmatched = unmatchedIds.has(medicine.id)

          return (
            <div
              key={medicine.id}
              onClick={() => !isUnmatched && onSelect(medicine)}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 transition-colors',
                isUnmatched ? 'cursor-default opacity-60' : isSelected ? 'cursor-pointer bg-gray-100 dark:bg-[#222222]' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {isSelected && !isUnmatched && <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-sm" style={{ background: 'var(--selection-indicator)' }} />}
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isUnmatched}
                onChange={() => {}}
                onClick={e => { if (isUnmatched) return; e.stopPropagation(); onToggleCheck(medicine.id) }}
                className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm', isSelected && !isUnmatched ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-900 dark:text-gray-100')}>
                  {medicine.name}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-[#929292]">
                  {medicine.mnn
                    ? <><span className="text-gray-400 dark:text-[#929292]">{t('excel_mnn_label')}</span>{medicine.mnn}{medicine.manufacturer !== '—' ? ` · ${medicine.manufacturer}` : ''}</>
                    : <>{medicine.manufacturer}{medicine.country !== '—' ? ` (${medicine.country})` : ''}</>
                  }
                </p>
              </div>
              {isUnmatched ? (
                <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]">
                  <AlertTriangle className="h-3 w-3" /> {t('excel_not_in_catalog')}
                </span>
              ) : cartQty > 0 ? (
                <span className="flex-shrink-0 inline-flex items-center rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs font-semibold text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]">
                  {t('excel_cart_qty', { count: cartQty })}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { onClear(); setTimeout(() => onFile(e.target.files?.[0]), 50) }} />
    </div>
  )
}
