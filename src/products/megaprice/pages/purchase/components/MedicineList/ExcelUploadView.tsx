import { useRef, useState, useCallback } from 'react'
import { UploadCloud, FileSpreadsheet, X, AlertCircle, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react'
import { read, utils } from 'xlsx'
import { cn } from '@/shared/utils/utils'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface ExcelUploadViewProps {
  medicines: Medicine[]
  catalogMedicines: Medicine[]
  onMedicinesLoaded: (medicines: Medicine[]) => void
  selectedId: string | null
  onSelect: (medicine: Medicine) => void
  checkedIds: string[]
  onToggleCheck: (id: string) => void
  cartQtyByMedicine: Record<string, number>
}

interface ParseError { row: number; message: string }
interface ParsedRow   { rowNum: number; name: string; mnn: string; manufacturer: string; country: string }

// Column mapping: index in Excel sheet (-1 = not mapped)
interface ColMap {
  name:         number
  mnn:          number
  manufacturer: number
  country:      number
}

// Step machine
type Step = 'idle' | 'mapping' | 'results' | 'error'

const PREVIEW_ROWS = 5
const COL_LETTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function colLabel(i: number) {
  return i < 26 ? COL_LETTERS[i] : `${COL_LETTERS[Math.floor(i / 26) - 1]}${COL_LETTERS[i % 26]}`
}

function autoDetect(headers: string[]): ColMap {
  const find = (...kw: string[]) =>
    headers.findIndex(h => kw.some(k => h.toLowerCase().includes(k.toLowerCase())))
  return {
    name:         find('назван', 'наимен', 'препарат', 'лекарств', 'товар', 'продукт'),
    mnn:          find('мнн', 'mnn', 'международн', 'непатент'),
    manufacturer: find('произв', 'фирм', 'бренд', 'компан'),
    country:      find('стран', 'country'),
  }
}

function applyMapping(rawData: unknown[][], map: ColMap): { rows: ParsedRow[]; errors: ParseError[] } {
  const errors: ParseError[] = []
  const rows:   ParsedRow[]  = []

  if (map.name === -1 && map.mnn === -1) {
    errors.push({ row: 0, message: 'Не указана колонка «Название» или «МНН»' })
    return { rows, errors }
  }

  rawData.slice(1).forEach((row, i) => {
    const rowNum = i + 2
    const name   = map.name         !== -1 ? String((row as string[])[map.name]         ?? '').trim() : ''
    const mnn    = map.mnn          !== -1 ? String((row as string[])[map.mnn]          ?? '').trim() : ''
    if (!name && !mnn) return
    const manufacturer = map.manufacturer !== -1 ? String((row as string[])[map.manufacturer] ?? '').trim() : ''
    const country      = map.country      !== -1 ? String((row as string[])[map.country]      ?? '').trim() : ''
    rows.push({ rowNum, name, mnn, manufacturer, country })
  })

  if (rows.length === 0) errors.push({ row: 0, message: 'Не удалось извлечь позиции из файла' })
  return { rows, errors }
}

function matchWithCatalog(rows: ParsedRow[], catalog: Medicine[]) {
  const medicines: Medicine[] = []
  const unmatchedIds = new Set<string>()

  rows.forEach(row => {
    let matched: Medicine | undefined
    if (row.mnn) {
      const q = row.mnn.toLowerCase()
      matched = catalog.find(m =>
        m.mnn.toLowerCase() === q || (m.mnnLatin != null && m.mnnLatin.toLowerCase() === q)
      )
    }
    if (!matched && row.name) {
      matched = catalog.find(m => m.name.toLowerCase() === row.name.toLowerCase())
    }
    if (matched) {
      if (!medicines.find(m => m.id === matched!.id)) medicines.push(matched)
    } else {
      const stubId = `unmatched-${row.rowNum}`
      if (!medicines.find(m => m.id === stubId)) {
        medicines.push({ id: stubId, name: row.name || row.mnn || `Строка ${row.rowNum}`, mnn: row.mnn, manufacturer: row.manufacturer || '—', country: row.country || '—', isFavorite: false })
        unmatchedIds.add(stubId)
      }
    }
  })
  return { medicines, unmatchedIds }
}

// ── Select component ───────────────────────────────────────────────────────────

interface ColSelectProps {
  label:      string
  required?:  boolean
  value:      number
  activeCols: number[]
  onChange:   (v: number) => void
}

function ColSelect({ label, required, value, activeCols, onChange }: ColSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={cn(
        'text-xs text-gray-500',
        required && 'font-medium text-gray-700',
      )}>
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        >
          <option value={-1}>—</option>
          {activeCols.map(i => (
            <option key={i} value={i}>{colLabel(i)}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ExcelUploadView({
  medicines, catalogMedicines, onMedicinesLoaded,
  selectedId, onSelect, checkedIds, onToggleCheck, cartQtyByMedicine,
}: ExcelUploadViewProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [step,        setStep]        = useState<Step>('idle')
  const [fileName,    setFileName]    = useState('')
  const [isDragging,  setIsDragging]  = useState(false)
  const [errors,      setErrors]      = useState<ParseError[]>([])
  const [unmatchedIds, setUnmatchedIds] = useState<Set<string>>(new Set())

  // Mapping step state
  const [rawData,    setRawData]    = useState<unknown[][]>([])
  const [headers,    setHeaders]    = useState<string[]>([])
  const [preview,    setPreview]    = useState<unknown[][]>([])
  const [colMap,     setColMap]     = useState<ColMap>({ name: -1, mnn: -1, manufacturer: -1, country: -1 })

  // ── File read ──
  async function readFile(file: File) {
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb  = read(buf, { type: 'array' })
      const ws  = wb.Sheets[wb.SheetNames[0]]
      const data = utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as unknown[][]

      if (!data || data.length < 2) {
        setErrors([{ row: 0, message: 'Файл пустой или не содержит данных' }])
        setStep('error')
        return
      }

      const hdrs = (data[0] as string[]).map(h => String(h ?? ''))
      setHeaders(hdrs)
      setRawData(data)
      setPreview(
        data.slice(1)
          .filter(row => (row as unknown[]).some(cell => String(cell ?? '').trim() !== ''))
          .slice(0, PREVIEW_ROWS)
      )
      setColMap(autoDetect(hdrs))
      setStep('mapping')
    } catch {
      setErrors([{ row: 0, message: 'Не удалось прочитать файл. Убедитесь, что это .xlsx, .xls или .csv.' }])
      setStep('error')
    }
  }

  function handleFile(file: File | undefined) { if (file) readFile(file) }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0])
  }, [])

  // ── Apply mapping ──
  function applyAndLoad() {
    const { rows, errors: errs } = applyMapping(rawData, colMap)
    if (errs.length > 0 && rows.length === 0) { setErrors(errs); setStep('error'); return }
    const { medicines: matched, unmatchedIds: unmatched } = matchWithCatalog(rows, catalogMedicines)
    setUnmatchedIds(unmatched)
    onMedicinesLoaded(matched)
    setStep('results')
  }

  // ── Clear ──
  function handleClear() {
    setStep('idle'); setFileName(''); setErrors([]); setRawData([]); setHeaders([])
    setPreview([]); setUnmatchedIds(new Set()); onMedicinesLoaded([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const matchedCount   = medicines.filter(m => !unmatchedIds.has(m.id)).length
  const unmatchedCount = unmatchedIds.size

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (step === 'idle') return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full max-w-sm cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        <div className="rounded-xl bg-gray-100 p-4">
          <UploadCloud className={cn('h-8 w-8 transition-colors', isDragging ? 'text-gray-900' : 'text-gray-400')} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">{isDragging ? 'Отпустите файл' : 'Перетащите файл или нажмите'}</p>
          <p className="mt-1 text-xs text-gray-400">Поддерживаются .xlsx, .xls, .csv</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
          <FileSpreadsheet className="h-4 w-4 text-gray-500" />
          Выбрать файл
        </button>
      </div>
      <p className="mt-4 max-w-sm text-center text-xs text-gray-400">
        После загрузки вы сможете указать какая колонка за что отвечает
      </p>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  )

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-xl bg-red-50 p-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">Ошибка при загрузке</p>
        {errors.map((e, i) => <p key={i} className="mt-1 text-xs text-red-500">{e.message}</p>)}
      </div>
      <button onClick={handleClear} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
        Попробовать снова
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  )

  // ── MAPPING ───────────────────────────────────────────────────────────────
  if (step === 'mapping') return (
    <>
      {/* Background: idle zone dimmed */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 pointer-events-none select-none opacity-30">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center">
          <div className="rounded-xl bg-gray-100 p-4">
            <UploadCloud className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Перетащите файл или нажмите</p>
            <p className="mt-1 text-xs text-gray-400">Поддерживаются .xlsx, .xls, .csv</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
            <FileSpreadsheet className="h-4 w-4 text-gray-500" />
            Выбрать файл
          </div>
        </div>
      </div>

      {/* Modal overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
        <div className="flex w-full max-w-2xl max-h-[85vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

          {/* Modal header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[280px]">{fileName}</span>
              <span className="text-xs text-gray-400 shrink-0">· {rawData.length - 1} строк</span>
            </div>
            <button
              onClick={handleClear}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Mapping form */}
            {(() => {
              const activeCols = headers
                .map((_, i) => i)
                .filter(i => rawData.slice(1).some(row => String((row as unknown[])[i] ?? '').trim() !== ''))
              return (
                <div>
                  <p className="mb-2.5 text-sm font-semibold text-gray-900">Укажите какая колонка за что отвечает</p>
                  <div className="grid grid-cols-4 gap-3">
                    <ColSelect label="Название"     required value={colMap.name}         activeCols={activeCols} onChange={v => setColMap(p => ({ ...p, name: v }))} />
                    <ColSelect label="МНН"                   value={colMap.mnn}          activeCols={activeCols} onChange={v => setColMap(p => ({ ...p, mnn: v }))} />
                    <ColSelect label="Производитель"         value={colMap.manufacturer} activeCols={activeCols} onChange={v => setColMap(p => ({ ...p, manufacturer: v }))} />
                    <ColSelect label="Страна"                value={colMap.country}      activeCols={activeCols} onChange={v => setColMap(p => ({ ...p, country: v }))} />
                  </div>
                </div>
              )
            })()}

            {/* Preview table — only columns that have at least one non-empty value */}
            {(() => {
              const activeCols = headers
                .map((_, i) => i)
                .filter(i => preview.some(row => String((row as unknown[])[i] ?? '').trim() !== ''))
              return (
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-900">
                    Предпросмотр <span className="font-normal text-gray-400">— первые {preview.length} строк</span>
                  </p>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          {activeCols.map(i => (
                            <th key={i} className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold text-gray-400">
                              {colLabel(i)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, ri) => (
                          <tr key={ri} className="border-b border-gray-100 last:border-0">
                            {activeCols.map(ci => (
                              <td key={ci} className="max-w-[160px] truncate whitespace-nowrap px-3 py-2 text-gray-600">
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
              )
            })()}

          </div>

          {/* Modal footer */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
            <button
              onClick={applyAndLoad}
              disabled={colMap.name === -1 && colMap.mnn === -1}
              className="h-9 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              Применить
            </button>
          </div>

        </div>
      </div>

      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { handleClear(); setTimeout(() => handleFile(e.target.files?.[0]), 50) }} />
    </>
  )

  // ── RESULTS ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Summary bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="max-w-[160px] truncate text-xs font-medium text-gray-700" title={fileName}>{fileName}</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs font-medium text-[#065F46]">
            {matchedCount} найдено
          </span>
          {unmatchedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#92400E]">
              <AlertTriangle className="h-3 w-3" />
              {unmatchedCount} не найдено
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('mapping')} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors">
            Изменить
          </button>
          <button onClick={handleClear} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Очистить
          </button>
        </div>
      </div>

      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2.5 border-b border-[#FEF3C7] bg-[#FFFBEB] px-4 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
          <p className="text-xs text-[#92400E]">
            {unmatchedCount} {unmatchedCount === 1 ? 'препарат не найден' : 'препарата не найдено'} в каталоге по МНН. Проверьте сопоставление колонок.
          </p>
        </div>
      )}

      {/* Medicine list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {medicines.map(medicine => {
          const isSelected  = medicine.id === selectedId
          const isChecked   = checkedIds.includes(medicine.id)
          const cartQty     = cartQtyByMedicine[medicine.id] ?? 0
          const isUnmatched = unmatchedIds.has(medicine.id)

          return (
            <div
              key={medicine.id}
              onClick={() => !isUnmatched && onSelect(medicine)}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 transition-colors',
                isUnmatched ? 'cursor-default opacity-60' : isSelected ? 'cursor-pointer bg-gray-100' : 'cursor-pointer hover:bg-gray-50'
              )}
            >
              {isSelected && !isUnmatched && <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-sm bg-gray-900" />}
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isUnmatched}
                onChange={() => {}}
                onClick={e => { if (isUnmatched) return; e.stopPropagation(); onToggleCheck(medicine.id) }}
                className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm', isSelected && !isUnmatched ? 'font-semibold text-gray-900' : 'font-medium text-gray-900')}>
                  {medicine.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {medicine.mnn
                    ? <><span className="text-gray-400">МНН: </span>{medicine.mnn}{medicine.manufacturer !== '—' ? ` · ${medicine.manufacturer}` : ''}</>
                    : <>{medicine.manufacturer}{medicine.country !== '—' ? ` (${medicine.country})` : ''}</>
                  }
                </p>
              </div>
              {isUnmatched ? (
                <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#92400E]">
                  <AlertTriangle className="h-3 w-3" /> Не в каталоге
                </span>
              ) : cartQty > 0 ? (
                <span className="flex-shrink-0 inline-flex items-center rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs font-semibold text-[#065F46]">
                  {cartQty} уп.
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { handleClear(); setTimeout(() => handleFile(e.target.files?.[0]), 50) }} />
    </div>
  )
}
