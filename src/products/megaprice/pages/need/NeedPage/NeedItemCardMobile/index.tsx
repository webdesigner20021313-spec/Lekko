import { Sparkles } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { NeedItem } from '@/products/megaprice/mocks/need.mocks'
import { STATUS_STYLE } from '../config'

export function NeedItemCardMobile({
  item,
  isChecked,
  recQty,
  onOpen,
  onToggle,
  onShowAI,
}: {
  item: NeedItem
  isChecked: boolean
  recQty: number
  onOpen: () => void
  onToggle: (id: string, e: MouseEvent) => void
  onShowAI: () => void
}) {
  const { t } = useTranslation()
  const cfg = STATUS_STYLE[item.status]
  return (
    <div
      onClick={onOpen}
      className="relative flex cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white active:bg-gray-50 dark:border-gray-700 dark:bg-[#111111]"
    >
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: cfg.borderColor }} />
      <div className="flex flex-1 items-start gap-2.5 px-3.5 py-3 pl-4">
        <input
          type="checkbox"
          checked={isChecked}
          onClick={e => e.stopPropagation()}
          onChange={(e) => onToggle(item.id, e as unknown as MouseEvent)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('flex-1 truncate text-sm font-semibold', item.status === 'dead' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100')}>
              {item.name}
            </p>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap', cfg.badgeCls)}>
              {t(`need_status_${item.status}`)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#929292]">{item.manufacturer} · {item.country}</p>

          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            <div className="rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-[#222222]">
              <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_th_stock')}</p>
              <p className={cn('mt-0.5 text-sm font-bold tabular-nums', item.stock === 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100')}>
                {item.stock === 0 ? '—' : item.stock}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-[#222222]">
              <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_th_doc')}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {item.daysOfCover > 0 ? Math.round(item.daysOfCover) : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-[#222222]">
              <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_th_sales')}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{item.avgDailySales.toFixed(1)}</p>
            </div>
            <div className={cn('rounded-lg px-2 py-1.5', recQty > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-[#222222]')}>
              <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-[#929292]">{t('need_th_need')}</p>
              <p className={cn('mt-0.5 text-sm font-bold tabular-nums', recQty > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-300 dark:text-gray-600')}>
                {recQty > 0 ? recQty : '—'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onShowAI() }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 dark:border-gray-700"
          aria-label="AI"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
