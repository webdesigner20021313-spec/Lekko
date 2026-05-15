import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/products/megaprice/pages/orders/types'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  const { bg, text } = ORDER_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', bg, text)}>
      {t(`order_status_${status}`)}
    </span>
  )
}
