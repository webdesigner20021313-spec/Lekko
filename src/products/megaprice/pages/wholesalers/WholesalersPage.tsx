import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, Package, Pencil, Send, Phone, X, Percent, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import { mockWholesalers, type Wholesaler } from '@/products/megaprice/mocks/wholesalers.mocks'
import { useWholesalersStore } from '@/products/megaprice/stores/useWholesalersStore'

// ─── Discount Modal ───────────────────────────────────────────────────────────

interface DiscountModalProps {
  wholesaler: Wholesaler
  initialValue: string
  onSave: (value: string) => void
  onClose: () => void
}

function DiscountModal({ wholesaler, initialValue, onSave, onClose }: DiscountModalProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEdit = wholesaler.discountPercent !== null

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onSave(value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [value, onClose, onSave])

  const parsed = parseFloat(value)
  const valid = value.trim() !== '' && !isNaN(parsed) && parsed > 0 && parsed <= 99

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="w-[360px] rounded-2xl bg-white shadow-2xl dark:bg-[#111111] dark:border dark:border-gray-700"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isEdit ? t('ws_modal_edit_title') : t('ws_modal_add_title')}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-[#929292]">{wholesaler.name}</p>
          </div>
          <button onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-[#929292]">{t('ws_modal_discount_label')}</label>
          <div className={cn(
            'flex items-center rounded-xl border transition-colors',
            valid ? 'border-gray-300 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/20 dark:border-gray-600 dark:focus-within:border-blue-400'
                  : value ? 'border-red-300 focus-within:border-red-400' : 'border-gray-200 focus-within:border-gray-400 dark:border-gray-700',
          )}>
            <input
              ref={inputRef}
              type="number"
              min="0.1"
              max="99"
              step="0.5"
              placeholder={t('ws_modal_placeholder')}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="h-10 flex-1 rounded-xl bg-transparent pl-3 text-sm text-gray-900 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500"
            />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-400">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          {value && !valid && (
            <p className="mt-1.5 text-xs text-red-500">{t('ws_modal_invalid')}</p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <button onClick={onClose}
            className="ml-auto rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
            {t('ws_modal_cancel')}
          </button>
          <button
            onClick={() => valid && onSave(value)}
            disabled={!valid}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              valid
                ? 'bg-gray-900 text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-[#222222] dark:text-[#929292]',
            )}>
            {t('ws_modal_save')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Discount Cells ───────────────────────────────────────────────────────────

function DiscountValueCell({ wholesaler }: { wholesaler: Wholesaler }) {
  if (wholesaler.discountPercent !== null) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]">
        −{wholesaler.discountPercent}%
      </span>
    )
  }
  return <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
}

function DiscountActionCell({ wholesaler, onOpen }: { wholesaler: Wholesaler; onOpen: () => void }) {
  const { t } = useTranslation()
  if (wholesaler.discountPercent !== null) {
    return (
      <button
        onClick={onOpen}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
        title={t('ws_modal_edit_title')}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    )
  }
  return (
    <button
      onClick={onOpen}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
      title={t('ws_modal_add_title')}
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  )
}

// ─── WholesalersPage ──────────────────────────────────────────────────────────

export function WholesalersPage() {
  const { t } = useTranslation()
  const storeDiscounts = useWholesalersStore(s => s.discounts)
  const setDiscount    = useWholesalersStore(s => s.setDiscount)

  const wholesalers = useMemo<Wholesaler[]>(() =>
    mockWholesalers.map(w => ({
      ...w,
      discountPercent: storeDiscounts[w.name] !== undefined ? storeDiscounts[w.name] : w.discountPercent,
    })),
    [storeDiscounts],
  )

  const [search,          setSearch]          = useState('')
  const [modalWholesaler, setModalWholesaler] = useState<Wholesaler | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return wholesalers
    return wholesalers.filter(w =>
      w.name.toLowerCase().includes(q) || w.city.toLowerCase().includes(q)
    )
  }, [wholesalers, search])

  const handleSave = useCallback((value: string) => {
    if (!modalWholesaler) return
    const parsed = parseFloat(value)
    const newDiscount = !value.trim() || isNaN(parsed) || parsed <= 0 ? null : parsed
    setDiscount(modalWholesaler.name, newDiscount)
    setModalWholesaler(null)
  }, [modalWholesaler, setDiscount])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">

      {/* ── Шапка ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('ws_title')}</h1>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-[#222222] dark:text-gray-400">
                {wholesalers.length}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-400 dark:text-[#929292]">{t('ws_subtitle')}</p>
          </div>

          <div className="relative w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('ws_search_ph')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500"
            />
          </div>
        </div>
      </div>

      {/* ── Таблица ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#111111]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#222222]">
              <Package className="h-5 w-5 text-gray-400 dark:text-[#929292]" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('ws_no_results')}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-[#929292]">{t('ws_no_results_hint')}</p>
          </div>
        ) : (
          <div className="overflow-hidden border-b border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#222222]">
                  <th className="w-10 px-4 py-3.5 text-center text-xs font-semibold uppercase text-gray-400 dark:text-[#929292]">#</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]" style={{ minWidth: 160 }}>{t('ws_col_name')}</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_city')}</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_phone')}</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_telegram')}</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_min_order')}</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_delivery')}</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-[#929292]">{t('ws_col_my_discount')}</th>
                  <th className="px-4 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
                {filtered.map((w, idx) => (
                  <tr key={w.id} className="h-14 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">

                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs text-gray-400">{idx + 1}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{w.name}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{w.city}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{w.phone}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {w.telegram ? (
                        <div className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{w.telegram}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(w.minOrderSum)}</span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('ws_delivery_days', { n: w.deliveryDays })}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <DiscountValueCell wholesaler={w} />
                    </td>
                    <td className="px-4 py-3.5">
                      <DiscountActionCell wholesaler={w} onOpen={() => setModalWholesaler(w)} />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modalWholesaler && (
        <DiscountModal
          wholesaler={modalWholesaler}
          initialValue={modalWholesaler.discountPercent !== null ? String(modalWholesaler.discountPercent) : ''}
          onSave={handleSave}
          onClose={() => setModalWholesaler(null)}
        />
      )}
    </div>
  )
}
