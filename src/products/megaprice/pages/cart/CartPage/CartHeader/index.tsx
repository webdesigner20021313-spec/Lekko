import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { useCancelActiveCart } from '@/products/megaprice/api/hooks'
import type { DistGroup } from '../types'

/** Сверху страницы: название + фильтр-чипы по дистрибьютору + кнопка «Отменить корзину». */
export function CartHeader({
  itemCount,
  groups,
  distFilter,
  onChangeFilter,
}: {
  itemCount: number
  groups: DistGroup[]
  distFilter: string | null
  onChangeFilter: (next: string | null) => void
}) {
  const { t } = useTranslation()
  const cancelCart = useCancelActiveCart()

  function handleCancel() {
    if (cancelCart.isLoading) return
    if (!confirm(t('cart_cancel_confirm', { defaultValue: 'Отменить корзину? Все позиции будут удалены.' }))) return
    cancelCart.appendData({})
  }

  return (
    <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6 dark:border-gray-700 dark:bg-[#111111]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('cart_title')}</h1>
        </div>

        <div className="h-5 w-px bg-gray-200 shrink-0 dark:bg-gray-700" />

        <div className="flex flex-1 gap-1.5 overflow-x-auto">
          <button
            onClick={() => onChangeFilter(null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
              distFilter === null
                ? 'bg-gray-900 text-white shadow-sm dark:bg-[#f1f1f1] dark:text-gray-900'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800',
            )}
          >
            {t('cart_filter_all', { n: itemCount })}
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => onChangeFilter(distFilter === g.id ? null : g.id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
                distFilter === g.id
                  ? 'bg-gray-900 text-white shadow-sm dark:bg-[#f1f1f1] dark:text-gray-900'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800',
              )}
            >
              {g.name} ({g.items.length})
            </button>
          ))}
        </div>

        {itemCount > 0 && (
          <button
            onClick={handleCancel}
            disabled={cancelCart.isLoading}
            className="shrink-0 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-[#111111] dark:text-red-400 dark:hover:bg-red-950"
          >
            {t('cart_cancel_btn', { defaultValue: 'Отменить корзину' })}
          </button>
        )}
      </div>
    </div>
  )
}
