import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { colLabel } from '../types'

export function ColSelect({ label, required, value, activeCols, onChange }: {
  label:      string
  required?:  boolean
  value:      number
  activeCols: number[]
  onChange:   (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={cn(
        'text-xs text-gray-500 dark:text-[#929292]',
        required && 'font-medium text-gray-700 dark:text-gray-300',
      )}>
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200 dark:focus:border-gray-500"
        >
          <option value={-1}>—</option>
          {activeCols.map(i => (
            <option key={i} value={i}>{colLabel(i)}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}
