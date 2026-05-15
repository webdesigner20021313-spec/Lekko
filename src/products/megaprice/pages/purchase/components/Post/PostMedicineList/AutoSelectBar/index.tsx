import { Zap } from 'lucide-react'
import { cn } from '@/shared/utils/utils'

export function AutoSelectBar({
  selectedCount,
  byDemand,
  setByDemand,
  onOpenModal,
}: {
  selectedCount: number
  byDemand: boolean
  setByDemand: (v: boolean | ((p: boolean) => boolean)) => void
  onOpenModal: () => void
}) {
  return (
    <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Выбрано: <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedCount}</span>
      </span>

      <div className="flex items-center gap-3">
        {/* Переключатель «По требованию» */}
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <span className="text-sm text-gray-600 dark:text-gray-400">По требованию</span>
          <button
            type="button"
            role="switch"
            aria-checked={byDemand}
            onClick={() => setByDemand((v) => !v)}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full border-2 transition-colors duration-200',
              byDemand ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900' : 'border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700',
            )}
          >
            <span className={cn(
              'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-200',
              byDemand ? 'translate-x-4 dark:bg-gray-900' : 'translate-x-0.5',
            )} />
          </button>
        </label>

        <button
          onClick={onOpenModal}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
        >
          <Zap className="h-4 w-4" />
          Авто-подбор
        </button>
      </div>
    </div>
  )
}
