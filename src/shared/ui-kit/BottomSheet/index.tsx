import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
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

const ANIM_MS = 280

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
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const t = setTimeout(() => setMounted(false), ANIM_MS)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null
  return (
    <div className={cn('fixed inset-0 z-50', mobileOnly && 'md:hidden', className)}>
      <div
        className={cn(
          'absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out will-change-transform dark:bg-[#090909]',
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ maxHeight }}
      >
        <div className="flex shrink-0 justify-center pt-2 pb-1">
          <div className="h-1 w-9 rounded-full bg-gray-300 dark:bg-[#3a3a3a]" />
        </div>
        {title !== undefined && (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 pb-4 pt-2 dark:border-gray-700 dark:bg-[#090909]">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="min-h-0 overflow-y-auto">{children}</div>

        {footer !== undefined && (
          <div className="shrink-0 bg-white px-5 py-3 pb-safe shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.12)] dark:bg-[#090909] dark:shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.5)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
