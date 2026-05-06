import { Heart } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'

const COL_CB  = 56
const COL_FAV = 56
const ROW_H   = 56

interface MedicineRowProps {
  medicine: Medicine
  isSelected: boolean
  isChecked: boolean
  isFavorite: boolean
  cartQty: number
  onSelect: () => void
  onToggleCheck: () => void
  onToggleFavorite: () => void
  showMnn: boolean
}

export function MedicineRow({
  medicine,
  isSelected, isChecked, isFavorite, cartQty,
  onSelect, onToggleCheck, onToggleFavorite, showMnn,
}: MedicineRowProps) {
  return (
    <tr
      onClick={onSelect}
      className={cn(
        'group cursor-pointer border-b border-gray-100 transition-colors',
        isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800',
      )}
    >
      {/* Checkbox — sticky left */}
      <td
        style={{
          position: 'sticky', left: 0, zIndex: 3,
          width: COL_CB, padding: 0,
          boxShadow: '1px 0 0 var(--table-cell-border)',
        }}
        className={cn(
          'transition-colors',
          isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-800',
        )}
      >
        {isSelected && (
          <span
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 3, background: 'var(--selection-indicator)', borderRadius: '0 2px 2px 0',
            }}
          />
        )}
        <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {}}
            onClick={(e) => { e.stopPropagation(); onToggleCheck() }}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
          />
        </div>
      </td>

      {/* Название */}
      <td style={{ padding: 0, overflow: 'hidden', borderRight: '1px solid var(--table-cell-border)' }}>
        <div style={{ height: ROW_H, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', padding: '0 12px' }}>
          <p
            className={cn('text-sm', isSelected ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-900 dark:text-gray-100')}
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {medicine.name}
          </p>
          <p
            className="text-xs text-gray-400"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {medicine.manufacturer} · {medicine.country}
          </p>
        </div>
      </td>

      {/* МНН */}
      {showMnn && (
        <td style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '0 12px' }}>
            <p
              className="text-sm text-gray-600 dark:text-gray-400"
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {medicine.mnn}
            </p>
          </div>
        </td>
      )}

      {/* Heart — sticky right */}
      <td
        style={{
          position: 'sticky', right: 0, zIndex: 3,
          width: COL_FAV, padding: 0,
          boxShadow: '-1px 0 0 var(--table-cell-border)',
        }}
        className={cn(
          'transition-colors',
          isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-800',
        )}
      >
        <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
              isFavorite
                ? 'border-amber-400 bg-amber-50 text-amber-400 dark:bg-amber-900/30'
                : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 dark:border-gray-700 dark:hover:border-gray-400 dark:hover:text-gray-200',
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-amber-400')} />
            {cartQty > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gray-900 px-0.5 text-[10px] font-bold leading-none text-white">
                {cartQty > 99 ? '99+' : cartQty}
              </span>
            )}
          </button>
        </div>
      </td>
    </tr>
  )
}
