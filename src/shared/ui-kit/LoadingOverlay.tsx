import { cn } from '@/shared/utils/utils'

/**
 * Полупрозрачный спиннер-оверлей поверх контейнера. Использовать вместе с
 * `position: relative` на родителе. Появляется когда `show=true` — фон
 * слегка размывается, по центру вращается кружок.
 *
 *   <div className="relative">
 *     <Table .../>
 *     <LoadingOverlay show={query.isLoading} />
 *   </div>
 *
 * Не блокирует уже отрендеренные данные — пользователь видит старое
 * содержимое поверх + индикатор «обновляется».
 */
export function LoadingOverlay({
  show,
  label,
  className,
}: {
  show: boolean
  label?: string
  className?: string
}) {
  if (!show) return null
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] dark:bg-[#111111]/50',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-[#222222]/95">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700 dark:border-gray-600 dark:border-t-gray-200" />
        {label && (
          <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
        )}
      </div>
    </div>
  )
}

/** Inline-spinner для маленьких блоков (кнопок, бейджей). */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-middle',
        className,
      )}
      aria-busy="true"
    />
  )
}
