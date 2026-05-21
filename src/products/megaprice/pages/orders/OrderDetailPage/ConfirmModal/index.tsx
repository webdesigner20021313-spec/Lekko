import { cn } from '@/shared/utils/utils'

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  backLabel,
  isDanger = false,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  confirmLabel: string
  backLabel: string
  isDanger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-[#111111] dark:border dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#929292]">{description}</p>
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {backLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors',
              isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
