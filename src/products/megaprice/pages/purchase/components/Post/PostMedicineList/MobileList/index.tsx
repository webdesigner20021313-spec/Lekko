import { Heart } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { VisibleCols } from '../config'

interface PosRow {
  id: string
  medicine: Medicine
  stock: number
  needed: number
  excess: number
}

export function MobileList({
  filtered,
  selectedMedicine,
  checkedIds,
  allFavoriteIds,
  visibleCols,
  onSelect,
  onToggleCheck,
  onToggleFavorite,
}: {
  filtered: PosRow[]
  selectedMedicine: Medicine | null
  checkedIds: string[]
  allFavoriteIds: string[]
  visibleCols: VisibleCols
  onSelect: (m: Medicine | null) => void
  onToggleCheck: (id: string) => void
  onToggleFavorite: (id: string) => void
}) {
  return (
    <div className="md:hidden flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#333333]">
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">Ничего не найдено</div>
      ) : filtered.map((row) => {
        const isSelected = selectedMedicine?.id === row.medicine.id
        const isChecked  = checkedIds.includes(row.medicine.id)
        const isFav      = allFavoriteIds.includes(row.medicine.id)
        return (
          <div
            key={row.id}
            onClick={() => onSelect(isSelected ? null : row.medicine)}
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
              onClick={(e) => { e.stopPropagation(); onToggleCheck(row.medicine.id) }}
              className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900"
            />
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm', isSelected ? 'font-semibold' : 'font-medium', 'text-gray-900 dark:text-gray-100')}>
                {row.medicine.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#929292]">
                {row.medicine.manufacturer} · {row.medicine.country}
              </p>
              {(visibleCols.stock || visibleCols.needed) && (
                <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 dark:text-[#929292]">
                  {visibleCols.stock && <span><span className="text-gray-400">Остаток:</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{row.stock ?? 0}</span></span>}
                  {visibleCols.needed && <span><span className="text-gray-400">Потребн.:</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{row.needed ?? 0}</span></span>}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(row.medicine.id) }}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                isFav ? 'border-amber-400 bg-amber-50 text-amber-400 dark:bg-amber-900/30' : 'border-gray-200 text-gray-400 dark:border-gray-700',
              )}
            >
              <Heart className={cn('h-4 w-4', isFav && 'fill-amber-400')} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
