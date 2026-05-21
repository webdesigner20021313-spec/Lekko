import { useTranslation } from 'react-i18next'

export function DocBar({ days }: { days: number }) {
  const { t } = useTranslation()
  return <span className="text-sm text-gray-700 tabular-nums dark:text-gray-300">{t('need_days_n', { n: Math.round(days) })}</span>
}
