import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function LoadingStep() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{t('autoselect_loading')}</p>
        <p className="mt-1 text-xs text-gray-400">{t('autoselect_loading_sub')}</p>
      </div>
    </div>
  )
}
