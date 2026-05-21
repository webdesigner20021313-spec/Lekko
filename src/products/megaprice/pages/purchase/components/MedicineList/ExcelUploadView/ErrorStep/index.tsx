import type { RefObject } from 'react'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ParseError } from '../types'

export function ErrorStep({
  errors,
  inputRef,
  onClear,
  onFile,
}: {
  errors: ParseError[]
  inputRef: RefObject<HTMLInputElement | null>
  onClear: () => void
  onFile: (f: File | undefined) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('excel_error_title')}</p>
        {errors.map((e, i) => <p key={i} className="mt-1 text-xs text-red-500">{e.message}</p>)}
      </div>
      <button onClick={onClear} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
        {t('excel_try_again')}
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
    </div>
  )
}
