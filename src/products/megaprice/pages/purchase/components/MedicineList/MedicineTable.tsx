import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { MedicineRow } from './MedicineRow'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface MedicineTableProps {
  medicines: Medicine[]
  selectedId: string | null
  onSelect: (medicine: Medicine) => void
  checkedIds: string[]
  onToggleCheck: (id: string) => void
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  cartQtyByDrugId: Record<number, number>
  panel1Width: number
  showMnn: boolean
  /** Смещение для нумерации (с учётом текущей страницы пагинации). Default 0. */
  startIndex?: number
}

const COL_CB  = 56
const COL_NUM = 48
const COL_MNN = 240
const COL_FAV = 56
const FIXED   = COL_CB + COL_NUM + COL_FAV
const MIN_NAME = 400

export function MedicineTable({
  medicines, selectedId, onSelect, checkedIds, onToggleCheck,
  favoriteIds, onToggleFavorite, cartQtyByDrugId, panel1Width, showMnn,
  startIndex = 0,
}: MedicineTableProps) {
  const { t } = useTranslation()
  const nameW  = Math.max(MIN_NAME, panel1Width - FIXED - (showMnn ? COL_MNN : 0))
  const tableW = Math.max(MIN_NAME + FIXED, panel1Width)

  const allChecked  = medicines.length > 0 && medicines.every((m) => checkedIds.includes(m.id))
  const someChecked = !allChecked && medicines.some((m) => checkedIds.includes(m.id))
  const cbRef = useRef<HTMLInputElement>(null)
  if (cbRef.current) cbRef.current.indeterminate = someChecked

  function handleSelectAll() {
    if (allChecked) {
      medicines.forEach((m) => { if (checkedIds.includes(m.id)) onToggleCheck(m.id) })
    } else {
      medicines.forEach((m) => { if (!checkedIds.includes(m.id)) onToggleCheck(m.id) })
    }
  }

  if (medicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-400">{t('medicines_not_found')}</p>
      </div>
    )
  }

  return (
    <>
    {/* Mobile cards */}
    <div className="md:hidden divide-y divide-gray-100 dark:divide-[#333333]">
      {medicines.map((medicine) => {
        const isSelected = medicine.id === selectedId
        const isChecked  = checkedIds.includes(medicine.id)
        const isFavorite = favoriteIds.includes(medicine.id)
        const cartQty    = (medicine.drugId != null ? cartQtyByDrugId[medicine.drugId] : 0) ?? 0
        return (
          <div
            key={medicine.id}
            onClick={() => onSelect(medicine)}
            className={cn(
              'relative flex cursor-pointer items-center gap-3 px-3 py-3 active:bg-gray-100 dark:active:bg-gray-800',
              isSelected ? 'bg-gray-50 dark:bg-[#222222]' : 'bg-white dark:bg-[#111111]',
            )}
          >
            {isSelected && <span className="absolute left-0 top-0 bottom-0 w-1 bg-gray-900 dark:bg-[#f1f1f1]" />}
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => {}}
              onClick={(e) => { e.stopPropagation(); onToggleCheck(medicine.id) }}
              className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900"
            />
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm', isSelected ? 'font-semibold' : 'font-medium', 'text-gray-900 dark:text-gray-100')}>
                {medicine.name}
              </p>
              {(medicine.manufacturer || medicine.country) && (
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#929292]">
                  {[medicine.manufacturer, medicine.country].filter(Boolean).join(' · ')}
                </p>
              )}
              {showMnn && medicine.mnn && (
                <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{medicine.mnn}</p>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(medicine.id) }}
              className={cn(
                'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                isFavorite
                  ? 'border-amber-400 bg-amber-50 text-amber-400 dark:bg-amber-900/30'
                  : 'border-gray-200 text-gray-400 dark:border-gray-700',
              )}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-amber-400')} />
              {cartQty > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gray-900 px-0.5 text-[10px] font-bold leading-none text-white">
                  {cartQty > 99 ? '99+' : cartQty}
                </span>
              )}
            </button>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
          </div>
        )
      })}
    </div>

    {/* Desktop table */}
    <table className="hidden md:table" style={{ tableLayout: 'fixed', width: tableW, borderCollapse: 'collapse' }}>
      <colgroup>
        <col style={{ width: COL_CB }} />
        <col style={{ width: COL_NUM }} />
        <col style={{ width: nameW }} />
        {showMnn && <col style={{ width: COL_MNN }} />}
        <col style={{ width: COL_FAV }} />
      </colgroup>
      <thead>
        <tr>
          <th
            style={{
              position: 'sticky', top: 0, left: 0, zIndex: 4, height: 48,
              width: COL_CB, background: 'var(--table-header-bg)', padding: 0,
              borderBottom: '1px solid var(--table-border)',
              boxShadow: '1px 0 0 var(--table-border)',
            }}
          >
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                ref={cbRef}
                type="checkbox"
                checked={allChecked}
                onChange={handleSelectAll}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
              />
            </div>
          </th>
          <th
            style={{
              position: 'sticky', top: 0, zIndex: 2, height: 48, background: 'var(--table-header-bg)',
              padding: 0, textAlign: 'center',
              borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)',
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">№</span>
          </th>
          <th
            style={{
              position: 'sticky', top: 0, zIndex: 2, height: 48, background: 'var(--table-header-bg)',
              padding: '0 12px', textAlign: 'left',
              borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)',
              overflow: 'hidden',
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]"
              style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('col_name')}
            </span>
          </th>
          {showMnn && (
            <th
              style={{
                position: 'sticky', top: 0, zIndex: 2, height: 48, background: 'var(--table-header-bg)',
                padding: '0 12px', textAlign: 'left',
                borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)',
                overflow: 'hidden',
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]"
                style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('col_mnn')}
              </span>
            </th>
          )}
          <th
            style={{
              position: 'sticky', top: 0, right: 0, zIndex: 4, height: 48,
              width: COL_FAV, background: 'var(--table-header-bg)', padding: 0,
              borderBottom: '1px solid var(--table-border)',
              boxShadow: '-1px 0 0 var(--table-border)',
            }}
          />
        </tr>
      </thead>
      <tbody>
        {medicines.map((medicine, idx) => (
          <MedicineRow
            key={medicine.id}
            medicine={medicine}
            rowNumber={startIndex + idx + 1}
            isSelected={medicine.id === selectedId}
            isChecked={checkedIds.includes(medicine.id)}
            isFavorite={favoriteIds.includes(medicine.id)}
            cartQty={(medicine.drugId != null ? cartQtyByDrugId[medicine.drugId] : 0) ?? 0}
            onSelect={() => onSelect(medicine)}
            onToggleCheck={() => onToggleCheck(medicine.id)}
            onToggleFavorite={() => onToggleFavorite(medicine.id)}
            showMnn={showMnn}
          />
        ))}
      </tbody>
    </table>
    </>
  )
}
