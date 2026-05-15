import { useMemo } from 'react'
import { X, Download, FileText, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatDateTime } from '@/shared/utils/format'
import { useDistributorOrderHistory } from '@/products/megaprice/api/hooks'
import {
  downloadHistoryPdf,
  downloadHistoryXlsx,
  type HistoryPayload,
} from '@/products/megaprice/api/invoice'
import type { Order } from '@/products/megaprice/pages/orders/types'

export function HistoryModal({
  distributorOrderId,
  distributorName,
  order,
  drugInfoById,
  onClose,
}: {
  distributorOrderId: number
  distributorName: string
  order: Order
  drugInfoById: Map<number, { name: string; producer: string; country: string }>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const history = useDistributorOrderHistory(distributorOrderId)
  const rows = Array.isArray(history.data) ? history.data : []

  function drugName(id: number): string {
    return drugInfoById.get(id)?.name ?? `Drug #${id}`
  }

  function typeLabel(type: string): string {
    switch (type) {
      case 'quantity':    return t('history_type_quantity')    ?? 'Изменено количество'
      case 'price':       return t('history_type_price')       ?? 'Изменена цена'
      case 'replacement': return t('history_type_replacement') ?? 'Замена препарата'
      case 'added':       return t('history_type_added')       ?? 'Добавлена позиция'
      case 'removed':     return t('history_type_removed')     ?? 'Удалена позиция'
      default:            return type
    }
  }

  function typeColor(type: string): string {
    switch (type) {
      case 'added':       return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900'
      case 'removed':     return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900'
      case 'replacement': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900'
      default:            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900'
    }
  }

  // Payload для backend PDF/XLSX. Для replacement бек кладёт в OldValue/NewValue
  // числовые drug_id — здесь подменяем на реальные названия препаратов, чтобы
  // в PDF/XLSX отчёте «Было» / «Стало» были человеко-читаемыми.
  const payload = useMemo<HistoryPayload>(() => ({
    orderNumber: order.number,
    distributorName,
    pharmacyName: order.pharmacyName,
    createdAt: new Date(order.createdAt).toISOString(),
    rows: rows.map(r => {
      if (r.type === 'replacement' && r.replacementDrugId) {
        return {
          type: 'replacement',
          drugName: drugName(r.drugId),
          oldValue: drugName(r.drugId),
          newValue: drugName(r.replacementDrugId),
          modifiedAt: r.modifiedAt,
          appliedToClient: r.appliedToClient,
        }
      }
      return {
        type: r.type as HistoryPayload['rows'][number]['type'],
        drugName: drugName(r.drugId),
        oldValue: r.oldValue,
        newValue: r.newValue,
        modifiedAt: r.modifiedAt,
        appliedToClient: r.appliedToClient,
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [rows, order, distributorName])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-[#111111] dark:border dark:border-gray-700">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('orders_history_title') ?? 'История изменений'}
            </h3>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#929292]">
              {distributorName} · {order.number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {history.isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              {t('orders_history_empty') ?? 'Изменений нет'}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {rows.map((r, idx) => (
                <li key={`${r.itemId}-${idx}`} className="rounded-lg border border-gray-200 px-3.5 py-3 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={cn('inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium', typeColor(r.type))}>
                        {typeLabel(r.type)}
                      </span>
                      <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {drugName(r.drugId)}
                        {r.type === 'replacement' && r.replacementDrugId && (
                          <>
                            <span className="mx-1.5 text-gray-400">→</span>
                            <span className="text-green-700 dark:text-green-400">{drugName(r.replacementDrugId)}</span>
                          </>
                        )}
                      </p>
                      {(r.oldValue || r.newValue) && r.type !== 'replacement' && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {r.oldValue && <span className="line-through text-red-500">{r.oldValue}</span>}
                          {r.oldValue && r.newValue && <span className="mx-1.5 text-gray-400">→</span>}
                          {r.newValue && <span className="font-semibold text-green-700 dark:text-green-400">{r.newValue}</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[11px]">
                      {r.modifiedAt && (
                        <p className="text-gray-400 dark:text-[#929292]">{formatDateTime(r.modifiedAt)}</p>
                      )}
                      <p className={cn('mt-0.5 font-medium', r.appliedToClient ? 'text-green-600' : 'text-gray-400')}>
                        {r.appliedToClient
                          ? (t('orders_history_applied') ?? 'Применено')
                          : (t('orders_history_pending') ?? 'Ожидает')}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <button
            onClick={() => downloadHistoryXlsx(distributorOrderId, payload)}
            disabled={rows.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={() => downloadHistoryPdf(distributorOrderId, payload)}
            disabled={rows.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>
    </div>
  )
}
