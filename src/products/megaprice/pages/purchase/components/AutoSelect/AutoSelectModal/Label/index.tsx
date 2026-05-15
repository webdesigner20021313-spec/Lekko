import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'

export function Label({
  children,
  onClear,
  hasValue,
}: {
  children: ReactNode
  onClear?: () => void
  hasValue?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{children}</p>
      {onClear !== undefined && (
        <button
          type="button"
          onClick={onClear}
          disabled={!hasValue}
          className={cn(
            'text-[12px] font-medium transition-colors',
            hasValue
              ? 'cursor-pointer text-red-500 hover:text-red-700'
              : 'cursor-default text-gray-300',
          )}
        >
          {t('filter_clear')}
        </button>
      )}
    </div>
  )
}
