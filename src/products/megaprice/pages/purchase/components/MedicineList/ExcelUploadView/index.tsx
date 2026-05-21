import { useRef, useState, useCallback } from 'react'
import { read, utils } from 'xlsx'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/client'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { ErrorStep } from './ErrorStep'
import { applyMapping, autoDetect, buildMatchedMedicines, type ResolveResult } from './helpers'
import { IdleStep } from './IdleStep'
import { MappingStep } from './MappingStep'
import { ResultsStep } from './ResultsStep'
import { PREVIEW_ROWS, type ColMap, type ParseError, type Step } from './types'

interface ExcelUploadViewProps {
  medicines: Medicine[]
  catalogMedicines: Medicine[]
  onMedicinesLoaded: (medicines: Medicine[]) => void
  selectedId: string | null
  onSelect: (medicine: Medicine) => void
  checkedIds: string[]
  onToggleCheck: (id: string) => void
  cartQtyByDrugId: Record<number, number>
}

export function ExcelUploadView({
  medicines, onMedicinesLoaded,
  selectedId, onSelect, checkedIds, onToggleCheck, cartQtyByDrugId,
}: ExcelUploadViewProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const [step,         setStep]         = useState<Step>('idle')
  const [fileName,     setFileName]     = useState('')
  const [isDragging,   setIsDragging]   = useState(false)
  const [errors,       setErrors]       = useState<ParseError[]>([])
  const [resolving,    setResolving]    = useState(false)
  const [unmatchedIds, setUnmatchedIds] = useState<Set<string>>(new Set())

  // Mapping step state
  const [rawData, setRawData] = useState<unknown[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<unknown[][]>([])
  const [colMap,  setColMap]  = useState<ColMap>({ name: -1, mnn: -1, manufacturer: -1, country: -1 })

  // ── File read ──
  async function readFile(file: File) {
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb  = read(buf, { type: 'array' })
      const ws  = wb.Sheets[wb.SheetNames[0]]
      const data = utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as unknown[][]

      if (!data || data.length < 2) {
        setErrors([{ row: 0, message: t('excel_err_empty') }])
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
      setErrors([{ row: 0, message: t('excel_err_read') }])
      setStep('error')
    }
  }

  function handleFile(file: File | undefined) { if (file) readFile(file) }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Apply mapping → резолв через бэкенд (Pricing: resolve-drug-producer) ──
  async function applyAndLoad() {
    const { rows, errors: errs } = applyMapping(rawData, colMap, t('excel_err_no_name_col'), t('excel_err_no_rows'))
    if (errs.length > 0 && rows.length === 0) { setErrors(errs); setStep('error'); return }

    setResolving(true)
    try {
      // 1:1 порядок: бэкенд матчит name(+producer) на канонический справочник.
      const items = rows.map(r => ({ name: r.name || r.mnn, producer: r.manufacturer || null }))
      const { data } = await api.post<ResolveResult[]>('/api/pricing/resolve-drug-producer', { items })
      const results = Array.isArray(data) ? data : []
      const { medicines: matched, unmatchedIds: unmatched } = buildMatchedMedicines(rows, results)
      setUnmatchedIds(unmatched)
      onMedicinesLoaded(matched)
      setStep('results')
    } catch {
      setErrors([{ row: 0, message: t('excel_err_read', { defaultValue: 'Не удалось сопоставить позиции. Попробуйте ещё раз.' }) }])
      setStep('error')
    } finally {
      setResolving(false)
    }
  }

  // ── Clear ──
  function handleClear() {
    setStep('idle'); setFileName(''); setErrors([]); setRawData([]); setHeaders([])
    setPreview([]); setUnmatchedIds(new Set()); onMedicinesLoaded([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const matchedCount   = medicines.filter(m => !unmatchedIds.has(m.id)).length
  const unmatchedCount = unmatchedIds.size

  if (step === 'idle') return (
    <IdleStep
      inputRef={inputRef}
      isDragging={isDragging}
      setIsDragging={setIsDragging}
      onDrop={handleDrop}
      onFile={handleFile}
    />
  )

  if (step === 'error') return (
    <ErrorStep
      errors={errors}
      inputRef={inputRef}
      onClear={handleClear}
      onFile={handleFile}
    />
  )

  if (step === 'mapping') return (
    <MappingStep
      fileName={fileName}
      rawData={rawData}
      headers={headers}
      preview={preview}
      colMap={colMap}
      setColMap={setColMap}
      inputRef={inputRef}
      onClear={handleClear}
      onApply={applyAndLoad}
      onFile={handleFile}
      applying={resolving}
    />
  )

  return (
    <ResultsStep
      medicines={medicines}
      selectedId={selectedId}
      onSelect={onSelect}
      checkedIds={checkedIds}
      onToggleCheck={onToggleCheck}
      cartQtyByDrugId={cartQtyByDrugId}
      unmatchedIds={unmatchedIds}
      fileName={fileName}
      matchedCount={matchedCount}
      unmatchedCount={unmatchedCount}
      inputRef={inputRef}
      onChangeMapping={() => setStep('mapping')}
      onClear={handleClear}
      onFile={handleFile}
    />
  )
}
