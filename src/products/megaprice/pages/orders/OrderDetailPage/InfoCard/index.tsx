import type { ReactNode } from 'react'

export function InfoCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#222222]">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 dark:text-[#929292]">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-[#929292]">{sub}</p>}
      </div>
    </div>
  )
}
