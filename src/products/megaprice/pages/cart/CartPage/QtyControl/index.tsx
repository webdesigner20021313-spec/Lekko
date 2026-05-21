import { Minus, Plus } from 'lucide-react'

export function QtyControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex w-[112px] shrink-0 items-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-l-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="flex-1 text-center text-[13px] font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-r-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}
