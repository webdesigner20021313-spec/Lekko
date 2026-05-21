import { useMemo } from 'react'
import { X, Sparkles, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import type { NeedItem } from '@/products/megaprice/mocks/need.mocks'
import { SEV_STYLE } from '../config'
import { getAIRecommendations } from '../helpers'

export function AIAdviceModal({ item, onClose }: { item: NeedItem; onClose: () => void }) {
  const { t } = useTranslation()
  const recs = useMemo(() => getAIRecommendations(item), [item])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative flex h-full max-h-[100vh] w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[88vh] md:max-w-[460px] md:rounded-2xl dark:bg-[#111111] dark:md:border dark:md:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#333333]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-700">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 leading-tight dark:text-gray-100">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{item.manufacturer} · {item.country}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {recs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('need_ai_ok_title')}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-[#929292]">{t('need_ai_ok_desc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#333333]">
              {recs.map((rec) => {
                const sev = SEV_STYLE[rec.severity]
                return (
                  <div key={rec.id} className="flex">
                    <div className={cn('w-[3px] shrink-0', sev.bar)} />
                    <div className="flex-1 min-w-0 px-4 pt-4 pb-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[18px] font-bold text-gray-900 leading-snug dark:text-gray-100">{rec.title}</p>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium leading-none', sev.badge)}>
                            {rec.icon}
                            {rec.badgeLabel}
                          </span>
                        </div>
                      </div>
                      {rec.analysis && (
                        <p className="text-sm text-gray-500 leading-relaxed mb-3 dark:text-gray-400">
                          {rec.analysis}
                          {rec.loss && (
                            <> <span className="text-red-500">{t('need_ai_losses_label')} {rec.loss}.</span></>
                          )}
                        </p>
                      )}
                      {rec.tableRows && rec.tableRows.length > 0 && (
                        <div className="mb-4 overflow-hidden rounded-lg border border-gray-100 dark:border-[#333333]">
                          {rec.tableHeaders && (
                            <div className="grid grid-cols-3 bg-gray-50 px-3 py-1.5 border-b border-gray-100 dark:bg-[#222222] dark:border-gray-700">
                              {rec.tableHeaders.map((h, hi) => (
                                <p key={hi} className={cn('text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#929292]', hi > 0 ? 'text-right' : 'text-left')}>{h}</p>
                              ))}
                            </div>
                          )}
                          {rec.tableRows.map((row, ri) => (
                            <div key={ri} className={cn('grid grid-cols-3 px-3 py-2 bg-white dark:bg-[#111111]', ri < rec.tableRows!.length - 1 && 'border-b border-gray-100 dark:border-[#333333]')}>
                              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{row[0]}</p>
                              <p className="text-right text-xs text-gray-500 dark:text-[#929292]">{row[1]}</p>
                              <p className="text-right text-xs font-semibold text-gray-900 dark:text-gray-100">{row[2]}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-900 mb-2.5 dark:text-gray-300">{t('need_ai_steps_title')}</p>
                        <ul className="space-y-2">
                          {rec.steps.map((step, si) => (
                            <li key={si} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold leading-none text-white">{si + 1}</span>
                              <span className="text-sm text-gray-700 leading-snug dark:text-gray-300">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 dark:border-[#333333] dark:bg-[#111111]">
          <button onClick={onClose} className="h-10 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition-all duration-200 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600">
            {t('need_ai_ok_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}
