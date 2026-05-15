import type { RefObject } from 'react'
import { UploadCloud, FileSpreadsheet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'

export function IdleStep({
  inputRef,
  isDragging,
  setIsDragging,
  onDrop,
  onFile,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  isDragging: boolean
  setIsDragging: (v: boolean) => void
  onDrop: (e: React.DragEvent) => void
  onFile: (f: File | undefined) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full max-w-sm cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging ? 'border-gray-900 bg-gray-50 dark:border-[#f1f1f1] dark:bg-[#222222]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800'
        )}
      >
        <div className="rounded-xl bg-gray-100 p-4 dark:bg-[#222222]">
          <UploadCloud className={cn('h-8 w-8 transition-colors', isDragging ? 'text-gray-900 dark:text-blue-400' : 'text-gray-400 dark:text-[#929292]')} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{isDragging ? t('excel_drop_active') : t('excel_drop_idle')}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-[#929292]">{t('excel_formats')}</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-300 dark:hover:bg-gray-700">
          <FileSpreadsheet className="h-4 w-4 text-gray-500 dark:text-[#929292]" />
          {t('excel_choose_file')}
        </button>
      </div>
      <p className="mt-4 max-w-sm text-center text-xs text-gray-400 dark:text-[#929292]">
        {t('excel_hint')}
      </p>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
    </div>
  )
}
