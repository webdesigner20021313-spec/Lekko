import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { DISTRIBUTOR_STATUS_CONFIG, type DistributorStatus } from '@/products/megaprice/pages/orders/types'

export function DistributorStatusBadge({ status }: { status: DistributorStatus }) {
  const { t } = useTranslation()
  const { bg, text } = DISTRIBUTOR_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', bg, text)}>
      {t(`dist_status_${status}`)}
    </span>
  )
}
