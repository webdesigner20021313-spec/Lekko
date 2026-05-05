import { AlertTriangle } from 'lucide-react'

interface Props {
  open:        boolean
  title:       string
  description: string
  onConfirm:   () => void
  onCancel:    () => void
}

export function ConfirmDeleteModal({ open, title, description, onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* Icon + text */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-500">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}
