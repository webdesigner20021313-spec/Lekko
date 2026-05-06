import { cn } from '@/shared/utils/utils'
import type { MedicineListTab } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface MedicineListTabsProps {
  active: MedicineListTab
  onChange: (tab: MedicineListTab) => void
  posCount: number
}

const tabs: { id: MedicineListTab; label: string }[] = [
  { id: 'manual', label: 'Вручную' },
  { id: 'pos', label: 'POS' },
  { id: 'excel', label: 'Excel' },
]

export function MedicineListTabs({ active, onChange, posCount }: MedicineListTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            active === tab.id
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          {tab.label}
          {tab.id === 'pos' && posCount > 0 && (
            <span
              className={cn(
                'inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-xs font-semibold',
                active === 'pos'
                  ? 'bg-gray-900 text-white'
                  : 'bg-[#DBEAFE] text-[#1E40AF]'
              )}
            >
              {posCount}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
