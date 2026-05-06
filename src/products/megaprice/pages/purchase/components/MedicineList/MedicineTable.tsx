import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
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
  cartQtyByMedicine: Record<string, number>
  panel1Width: number
  showMnn: boolean
}

const COL_CB  = 56
const COL_MNN = 240
const COL_FAV = 56
const FIXED   = COL_CB + COL_FAV
const MIN_NAME = 400

export function MedicineTable({
  medicines, selectedId, onSelect, checkedIds, onToggleCheck,
  favoriteIds, onToggleFavorite, cartQtyByMedicine, panel1Width, showMnn,
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
    <table style={{ tableLayout: 'fixed', width: tableW, borderCollapse: 'collapse' }}>
      <colgroup>
        <col style={{ width: COL_CB }} />
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
              padding: '0 12px', textAlign: 'left',
              borderBottom: '1px solid var(--table-border)', borderRight: '1px solid var(--table-border)',
              overflow: 'hidden',
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
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
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
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
        {medicines.map((medicine) => (
          <MedicineRow
            key={medicine.id}
            medicine={medicine}
            isSelected={medicine.id === selectedId}
            isChecked={checkedIds.includes(medicine.id)}
            isFavorite={favoriteIds.includes(medicine.id)}
            cartQty={cartQtyByMedicine[medicine.id] ?? 0}
            onSelect={() => onSelect(medicine)}
            onToggleCheck={() => onToggleCheck(medicine.id)}
            onToggleFavorite={() => onToggleFavorite(medicine.id)}
            showMnn={showMnn}
          />
        ))}
      </tbody>
    </table>
  )
}
