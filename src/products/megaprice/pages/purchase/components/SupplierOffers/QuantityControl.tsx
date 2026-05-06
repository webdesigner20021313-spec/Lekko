import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/utils/utils'

interface QuantityControlProps {
  value: number
  onChange: (value: number) => void
}

export function QuantityControl({ value, onChange }: QuantityControlProps) {
  return (
    <div className="flex w-full items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors',
          value === 0
            ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
        )}
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v) && v >= 0) onChange(v)
        }}
        className={cn(
          'h-7 min-w-0 flex-1 rounded-md border text-center text-sm font-medium outline-none transition-colors focus:ring-1',
          value > 0
            ? 'border-gray-400 text-gray-900 focus:ring-gray-200 dark:border-gray-500 dark:text-gray-100 dark:bg-gray-800 dark:focus:ring-gray-600'
            : 'border-gray-200 text-gray-500 focus:ring-gray-100 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800 dark:focus:ring-gray-700'
        )}
      />
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}
