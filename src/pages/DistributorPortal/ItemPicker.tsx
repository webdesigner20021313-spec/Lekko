import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { useDistributorAssortment, useVariantsToDrugs, type ApiPriceItem, type ApiVariantDrugMap } from './api/hooks'

interface Props {
  distributorId: number
  /** Уже выбранный id — для подсветки чекмарка. Тут это drugId (либо item.drugId). */
  selectedDrugId?: number | null
  /** Вызывается при выборе item — содержит drug_id (если linked) и текущую цену. */
  onSelect: (item: ApiPriceItem) => void
  buttonLabel: string
  buttonClassName?: string
}

const PAGE_SIZE = 20
const POPUP_WIDTH = 420
const POPUP_HEIGHT_EST = 420 // ~max-h-list + header + pagination

/**
 * Поповер-селект для ассортимента дистра с серверным поиском и пагинацией.
 * Возвращает в onSelect полную PriceItem строку — caller сам решит что взять
 * (для replacement — только drug_id, для add — drug_id + price).
 *
 * Items без drug_id (`isLinked=false`) показываются disabled, потому что
 * distributor_order_items.drug_id NOT NULL.
 */
export function ItemPicker({
  distributorId,
  selectedDrugId,
  onSelect,
  buttonLabel,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const debounced = useDebouncedValue(query, 300)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setPage(1) }, [debounced])

  // Позиционирование popup'а под/над кнопкой. Popup вне overflow-hidden
  // контейнеров — рендерится в document.body через portal. При scroll/resize
  // пересчитываем координаты, чтобы popup ехал за кнопкой (а не закрывался).
  useLayoutEffect(() => {
    if (!open) return
    function reposition() {
      if (!btnRef.current) return
      const rect = btnRef.current.getBoundingClientRect()
      // Кнопка вылезла за viewport — закрываем (нет якоря).
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false)
        return
      }
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow > POPUP_HEIGHT_EST + 16 || spaceBelow > rect.top
        ? rect.bottom + 4
        : Math.max(8, rect.top - POPUP_HEIGHT_EST - 4)
      let left = rect.right - POPUP_WIDTH
      if (left < 8) left = 8
      if (left + POPUP_WIDTH > window.innerWidth - 8) {
        left = window.innerWidth - POPUP_WIDTH - 8
      }
      setPos({ top, left })
    }
    reposition()
    // capture: true — ловим скролл и у вложенных контейнеров (таблица, main).
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  // Закрытие на клик вне (учитываем и кнопку, и popup внутри portal'а).
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const api = useDistributorAssortment(open ? distributorId : null, debounced, page, PAGE_SIZE)
  const data = api.data as { items?: ApiPriceItem[]; totalPages?: number; totalCount?: number; hasNext?: boolean; hasPrevious?: boolean } | undefined
  const rawItems = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const totalCount = data?.totalCount ?? 0

  // Резолвим variant_id → drug_id через Matching: backend Pricing не делает
  // этот JOIN (cross-database), поэтому добиваем на фронте отдельным batch'ем.
  const variantsApi = useVariantsToDrugs()
  const variantIds = useMemo(
    () => rawItems.map((it) => it.variantId).filter((v): v is number => !!v),
    [rawItems],
  )
  const variantIdsKey = variantIds.slice().sort((a, b) => a - b).join(',')
  useEffect(() => {
    if (variantIds.length > 0) variantsApi.appendData(variantIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantIdsKey])
  const drugIdByVariant = useMemo(() => {
    const m = new Map<number, number>()
    const list = (Array.isArray(variantsApi.data) ? variantsApi.data : []) as ApiVariantDrugMap[]
    list.forEach((row) => m.set(row.variantId, row.drugId))
    return m
  }, [variantsApi.data])

  // Items с подстановкой drug_id из mapping'а (если backend сам не отдал).
  const items: ApiPriceItem[] = useMemo(
    () => rawItems.map((it) => {
      if (it.drugId != null) return it
      if (it.variantId == null) return it
      const resolved = drugIdByVariant.get(it.variantId)
      return resolved != null ? { ...it, drugId: resolved } : it
    }),
    [rawItems, drugIdByVariant],
  )

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:bg-[#222222]',
          buttonClassName,
        )}
      >
        <Search className="h-3.5 w-3.5 text-gray-400" />
        {buttonLabel}
      </button>

      {open && pos && createPortal(
        <div
          ref={popupRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: POPUP_WIDTH, zIndex: 9999 }}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#111111]"
        >
          {/* Search */}
          <div className="flex h-10 items-center gap-2 border-b border-gray-100 px-3 dark:border-gray-700">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию, производителю…"
              className="h-full flex-1 bg-transparent text-sm focus:outline-none dark:text-gray-200"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto">
            {api.isLoading && items.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">Загружаем…</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">Ничего не найдено</p>
            ) : (
              items.map((it) => {
                const noDrugId = !it.isLinked || it.drugId == null
                const isSelected = selectedDrugId != null && it.drugId === selectedDrugId
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => { onSelect(it); setOpen(false) }}
                    className={cn(
                      'flex w-full items-start gap-2 border-b border-gray-50 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-gray-50 dark:border-[#222222] dark:hover:bg-[#222222]',
                      isSelected && 'bg-gray-50 dark:bg-[#222222]',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {it.itemName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {it.producerName ?? '—'}
                        {it.expireDate && <> · до {new Date(it.expireDate).toLocaleDateString('ru-RU')}</>}
                        {noDrugId && <> · <span className="text-amber-600" title="Нет привязки к справочнику drugs — backend может отклонить">не привязан</span></>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {Number(it.price).toLocaleString('ru-RU')}
                      </p>
                      <p className="text-[10px] text-gray-400">UZS</p>
                    </div>
                    {isSelected && <Check className="mt-1 h-4 w-4 shrink-0 text-green-600" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Стр. {page} из {totalPages} · {totalCount} поз.
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-[#222222]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-[#222222]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}
