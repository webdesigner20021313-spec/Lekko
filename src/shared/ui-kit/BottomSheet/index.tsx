import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  footer?: ReactNode
  children: ReactNode
  /** Tailwind max-height value for the sheet (default '88vh') */
  maxHeight?: string
  /** Hide on >=md breakpoint (use when sheet is mobile-only). Default true. */
  mobileOnly?: boolean
  className?: string
}

/**
 * Bottom-anchored sheet for mobile filter/detail/action surfaces.
 *
 * Renders a backdrop + sheet container with sticky header (title + close button)
 * and optional sticky footer (actions, with iOS safe-area padding).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  footer,
  children,
  maxHeight = '88vh',
  mobileOnly = true,
  className,
}: BottomSheetProps) {
  if (!open) return null
  return (
    <div className={cn('fixed inset-0 z-50', mobileOnly && 'md:hidden', className)}>
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-[#111111]"
        style={{ maxHeight }}
      >
        {title !== undefined && (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-gray-700 dark:bg-[#111111]">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer !== undefined && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-3 pb-safe dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
