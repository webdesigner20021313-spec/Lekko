import type { RefObject } from 'react'
import { FileSpreadsheet, UploadCloud, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ColSelect } from '../ColSelect'
import { colLabel, type ColMap } from '../types'

/**
 * Шаг 2 — mapping колонок Excel → fields (name/mnn/manufacturer/country).
 * Рендерится поверх dimmed idle-зоны (для контекста).
 */
export function MappingStep({
  fileName,
  rawData,
  headers,
  preview,
  colMap,
  setColMap,
  inputRef,
  onClear,
  onApply,
  onFile,
}: {
  fileName: string
  rawData: unknown[][]
  headers: string[]
  preview: unknown[][]
  colMap: ColMap
  setColMap: (next: ColMap | ((p: ColMap) => ColMap)) => void
  inputRef: RefObject<HTMLInputElement | null>
  onClear: () => void
  onApply: () => void
  onFile: (f: File | undefined) => void
}) {
  const { t } = useTranslation()

  const activeColsForMapping = headers
    .map((_, i) => i)
    .filter(i => rawData.slice(1).some(row => String((row as unknown[])[i] ?? '').trim() !== ''))

  const activeColsForPreview = headers
    .map((_, i) => i)
    .filter(i => preview.some(row => String((row as unknown[])[i] ?? '').trim() !== ''))

  return (
    <>
      {/* Background: idle zone dimmed */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 pointer-events-none select-none opacity-30">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center">
          <div className="rounded-xl bg-gray-100 p-4">
            <UploadCloud className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{t('excel_drop_idle')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('excel_formats')}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
            <FileSpreadsheet className="h-4 w-4 text-gray-500" />
            {t('excel_choose_file')}
          </div>
        </div>
      </div>

      {/* Modal overlay */}
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px] md:items-center md:p-4">
        <div className="flex h-full max-h-[100vh] w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl dark:bg-[#111111] dark:md:border dark:md:border-gray-700">

          {/* Modal header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[280px] dark:text-gray-100">{fileName}</span>
              <span className="text-xs text-gray-400 shrink-0 dark:text-gray-500">· {t('excel_rows_count', { count: rawData.length - 1 })}</span>
            </div>
            <button
              onClick={onClear}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Mapping form */}
            <div>
              <p className="mb-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{t('excel_mapping_title')}</p>
              <div className="grid grid-cols-4 gap-3">
                <ColSelect label={t('col_name')}         required value={colMap.name}         activeCols={activeColsForMapping} onChange={v => setColMap(p => ({ ...p, name: v }))} />
                <ColSelect label={t('col_mnn')}                   value={colMap.mnn}          activeCols={activeColsForMapping} onChange={v => setColMap(p => ({ ...p, mnn: v }))} />
                <ColSelect label={t('filter_manufacturer')}       value={colMap.manufacturer} activeCols={activeColsForMapping} onChange={v => setColMap(p => ({ ...p, manufacturer: v }))} />
                <ColSelect label={t('filter_country')}            value={colMap.country}      activeCols={activeColsForMapping} onChange={v => setColMap(p => ({ ...p, country: v }))} />
              </div>
            </div>

            {/* Preview table */}
            <div>
              <p className="mb-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('excel_preview_title')} <span className="font-normal text-gray-400 dark:text-[#929292]">— {t('excel_preview_rows', { count: preview.length })}</span>
              </p>
              <div className="rounded-xl border border-gray-200 overflow-hidden dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-[#222222]">
                        {activeColsForPreview.map(i => (
                          <th key={i} className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold text-gray-400 dark:text-[#929292]">
                            {colLabel(i)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-100 last:border-0 dark:border-[#333333]">
                          {activeColsForPreview.map(ci => (
                            <td key={ci} className="max-w-[160px] truncate whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-400">
                              {String((row as unknown[])[ci] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* Modal footer */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-[#111111]">
            <button
              onClick={onApply}
              disabled={colMap.name === -1 && colMap.mnn === -1}
              className="h-9 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('excel_apply')}
            </button>
          </div>

        </div>
      </div>

      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { onClear(); setTimeout(() => onFile(e.target.files?.[0]), 50) }} />
    </>
  )
}
