import { useState, useMemo, useCallback, useEffect } from 'react'
import { Search, Package, Pencil, Send, Phone, Check, X } from 'lucide-react'
import { formatCurrency } from '@/shared/utils/format'
import { mockWholesalers, type Wholesaler } from '@/products/megaprice/mocks/wholesalers.mocks'
import { useWholesalersStore } from '@/products/megaprice/stores/useWholesalersStore'

// ─── Discount Cell ────────────────────────────────────────────────────────────

interface DiscountCellProps {
  wholesaler: Wholesaler
  isEditing: boolean
  editValue: string
  onStartEdit: (id: string, current: number | null) => void
  onEditChange: (val: string) => void
  onSave: (id: string) => void
  onCancel: () => void
}

function DiscountCell({
  wholesaler, isEditing, editValue,
  onStartEdit, onEditChange, onSave, onCancel,
}: DiscountCellProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  onSave(wholesaler.id)
    if (e.key === 'Escape') onCancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-lg border border-gray-300 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/20">
          <input
            type="number"
            min="0"
            max="99"
            step="0.5"
            autoFocus
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 w-14 rounded-lg bg-transparent px-2 text-center text-sm text-gray-900 focus:outline-none"
          />
          <span className="pr-2 text-xs text-gray-400">%</span>
        </div>
        <button
          onClick={() => onSave(wholesaler.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-green-600 hover:bg-green-50"
          title="Сохранить"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          title="Отмена"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (wholesaler.discountPercent !== null) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          −{wholesaler.discountPercent}%
        </span>
        <button
          onClick={() => onStartEdit(wholesaler.id, wholesaler.discountPercent)}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:text-gray-800 transition-colors"
          title="Изменить скидку"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => onStartEdit(wholesaler.id, null)}
      className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
    >
      + Добавить скидку
    </button>
  )
}

// ─── WholesalersPage ──────────────────────────────────────────────────────────

export function WholesalersPage() {
  const storeDiscounts = useWholesalersStore(s => s.discounts)
  const setDiscount    = useWholesalersStore(s => s.setDiscount)

  // Merge mock list with store: store overrides mock if user has explicitly set a value
  const wholesalers = useMemo<Wholesaler[]>(() =>
    mockWholesalers.map(w => ({
      ...w,
      discountPercent: storeDiscounts[w.name] !== undefined ? storeDiscounts[w.name] : w.discountPercent,
    })),
    [storeDiscounts],
  )

  const [search,    setSearch]    = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditingId(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return wholesalers
    return wholesalers.filter(w =>
      w.name.toLowerCase().includes(q) || w.city.toLowerCase().includes(q)
    )
  }, [wholesalers, search])

  const handleStartEdit = useCallback((id: string, current: number | null) => {
    setEditingId(id)
    setEditValue(current !== null ? String(current) : '')
  }, [])

  const handleSave = useCallback((id: string) => {
    const parsed = parseFloat(editValue)
    const newDiscount = !editValue.trim() || isNaN(parsed) || parsed <= 0 ? null : parsed
    const w = wholesalers.find(w => w.id === id)
    if (w) setDiscount(w.name, newDiscount)
    setEditingId(null)
    setEditValue('')
  }, [editValue, wholesalers, setDiscount])

  const handleCancel = useCallback(() => {
    setEditingId(null)
    setEditValue('')
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">

      {/* ── Шапка ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Дистрибуторы</h1>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {wholesalers.length}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-400">
              Укажите вашу скидку — она будет применяться при расчёте цен
            </p>
          </div>

          {/* Поиск */}
          <div className="relative w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Название, город..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
          </div>
        </div>
      </div>

      {/* ── Таблица ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Дистрибуторы не найдены</p>
            <p className="mt-1 text-sm text-gray-500">Попробуйте изменить поисковый запрос</p>
          </div>
        ) : (
          <div className="overflow-hidden border-b border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="w-10 px-4 py-3.5 text-center text-xs font-semibold uppercase text-gray-400">#</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500" style={{ minWidth: 160 }}>Название</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500">Город</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500">Телефон</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500">Телеграм</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase text-gray-500">Мин. заказ</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase text-gray-500">Доставка</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase text-gray-500" style={{ minWidth: 160 }}>Моя скидка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((w, idx) => (
                  <tr key={w.id} className="h-14 transition-colors hover:bg-gray-50">

                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs text-gray-400">{idx + 1}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{w.name}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{w.city}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="text-sm text-gray-600">{w.phone}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {w.telegram ? (
                        <div className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span className="text-sm text-gray-600">{w.telegram}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-600">{formatCurrency(w.minOrderSum)}</span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm text-gray-600">{w.deliveryDays} дн.</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <DiscountCell
                        wholesaler={w}
                        isEditing={editingId === w.id}
                        editValue={editValue}
                        onStartEdit={handleStartEdit}
                        onEditChange={setEditValue}
                        onSave={handleSave}
                        onCancel={handleCancel}
                      />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}
      </div>
    </div>
  )
}
