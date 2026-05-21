import type { OrderStatus } from '@/products/megaprice/pages/orders/types'

export const KPI_CARDS: { status: OrderStatus; labelKey: string }[] = [
  { status: 'new',       labelKey: 'orders_kpi_new' },
  { status: 'modified',  labelKey: 'orders_kpi_modified' },
  { status: 'completed', labelKey: 'orders_kpi_completed' },
  { status: 'cancelled', labelKey: 'orders_kpi_cancelled' },
]
