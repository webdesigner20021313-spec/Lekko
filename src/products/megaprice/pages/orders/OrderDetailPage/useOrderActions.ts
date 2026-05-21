import {
  useAcceptOneDistributor,
  useRejectOneDistributor,
  useAcceptDiff,
  useCancelPurchase,
} from '@/products/megaprice/api/hooks'
import type {
  Order,
  OrderDistributorGroup,
  DistributorStatus,
} from '@/products/megaprice/pages/orders/types'

function recalcTotals(groups: OrderDistributorGroup[]) {
  const active = groups.filter(g => g.distributorStatus !== 'cancelled')
  return {
    totalSum: active.reduce((s, g) => s + g.subtotal, 0),
    totalQty: active.reduce((s, g) => s + g.items.reduce((qs, i) => qs + i.quantity, 0), 0),
  }
}

/**
 * Действия страницы деталей заказа: per-distributor accept/reject/cancel и
 * глобальные complete/cancel. Каждое = мутация на бэк + optimistic-патч local
 * order (реальное состояние перезаполняется через onRefetchDetail). Вынесено из
 * OrderDetailContent, чтобы компонент остался render'ом.
 *
 * Per-distributor действие применяется ТОЛЬКО к одному distributor_order;
 * purchases.status_id пересчитывается на бэке по совокупности (RecalcPurchaseStatus).
 */
export function useOrderActions(params: {
  purchaseId: number
  order: Order
  setOrder: (o: Order) => void
  closeModal: () => void
  onRefetchDetail: () => void
}) {
  const { purchaseId, order, setOrder, closeModal, onRefetchDetail } = params

  const acceptApi = useAcceptOneDistributor(() => onRefetchDetail())
  const rejectApi = useRejectOneDistributor(() => onRefetchDetail())
  const cancelPurchaseApi = useCancelPurchase(() => onRefetchDetail())
  const acceptAllApi = useAcceptDiff(() => onRefetchDetail())
  const proposalBusy = acceptApi.isLoading || rejectApi.isLoading || cancelPurchaseApi.isLoading || acceptAllApi.isLoading

  // Per-distributor accept — применяется ТОЛЬКО к одному дистру, не ко всем.
  function handleAcceptProposal(distributorId: string) {
    if (proposalBusy) return
    const group = order.groups.find((g) => g.distributorId === distributorId)
    if (!group?.distributorOrderId) return
    acceptApi.appendData({}, { id: purchaseId, distrOrderId: group.distributorOrderId })
    // Optimistic — после refetch'а реальное состояние перезаполнится.
    const updatedGroups = order.groups.map((g) =>
      g.distributorId === distributorId
        ? { ...g, distributorStatus: 'accepted' as DistributorStatus, proposal: undefined }
        : g,
    )
    setOrder({ ...order, groups: updatedGroups })
  }

  function handleRejectProposal(distributorId: string) {
    if (proposalBusy) return
    const group = order.groups.find((g) => g.distributorId === distributorId)
    if (!group?.distributorOrderId) return
    rejectApi.appendData({ actorRole: 'pharm' }, { id: purchaseId, distrOrderId: group.distributorOrderId })
    // Только локальный distributorStatus меняем; order.status — пусть приходит из refetch
    // (иначе stale optimistic 'cancelled' заклинит UI после следующего accept).
    const updatedGroups = order.groups.map((g) =>
      g.distributorId === distributorId
        ? { ...g, distributorStatus: 'cancelled' as DistributorStatus, proposal: undefined }
        : g,
    )
    setOrder({ ...order, groups: updatedGroups, ...recalcTotals(updatedGroups) })
  }

  function handleCompleteOrder() {
    if (proposalBusy) return
    // «Завершить заказ» = atomic accept-all через PUT /api/purchases/{id}/accept.
    // Раньше тут был цикл acceptApi.appendData(...) per-DO с теми же race-condition
    // проблемами что и для cancel — параллельные PUT'ы делали Recalc, перетирая друг друга.
    // Полагаемся на refetch + не ставим order.status оптимистично (см. handleCancelOrder).
    acceptAllApi.appendData({ actorRole: 'pharm' }, { id: purchaseId })
    closeModal()
    const updatedGroups = order.groups.map((g) =>
      (g.distributorStatus === 'new' || g.distributorStatus === 'offer' || g.distributorStatus === 'sent')
        ? { ...g, distributorStatus: 'accepted' as DistributorStatus, proposal: undefined }
        : g,
    )
    setOrder({ ...order, groups: updatedGroups, ...recalcTotals(updatedGroups) })
  }

  function handleCancelOrder() {
    // ОДИН atomic-запрос POST /api/purchases/{id}/cancel — реджектит все
    // distributor_orders + Recalc purchase status в ОДНОЙ транзакции.
    //
    // ⚠ Раньше тут был цикл rejectApi.appendData(...) per-DO. Это создавало
    // race condition: два PUT уходили параллельно, каждый делал Recalc,
    // но видел соседний DO в незакоммиченном состоянии (status=10) →
    // последний commit считал status=1 ("Новый") вместо ожидаемого 6 (cancelled).
    //
    // ⚠ Также НЕ ставим order.status='cancelled' оптимистично — если потом
    // юзер сделает accept, optimistic 'cancelled' заклинит UI до refetch.
    // Полагаемся только на onRefetchDetail() в onSuccess хука.
    if (proposalBusy) return
    cancelPurchaseApi.appendData({ actorRole: 'pharm' }, { id: purchaseId })
    closeModal()
    const updatedGroups = order.groups.map(g => ({
      ...g,
      distributorStatus: 'cancelled' as DistributorStatus,
    }))
    setOrder({ ...order, groups: updatedGroups })
  }

  // Phase 5.1: cancel одного дистра из 3-точечного меню в карточке.
  function handleCancelDistributor(distributorId: string) {
    if (proposalBusy) return
    const group = order.groups.find((g) => g.distributorId === distributorId)
    if (!group?.distributorOrderId) return
    rejectApi.appendData({}, { id: purchaseId, distrOrderId: group.distributorOrderId })
    const updatedGroups = order.groups.map(g =>
      g.distributorId === distributorId
        ? { ...g, distributorStatus: 'cancelled' as DistributorStatus, proposal: undefined }
        : g,
    )
    setOrder({ ...order, groups: updatedGroups, ...recalcTotals(updatedGroups) })
  }

  return {
    proposalBusy,
    handleAcceptProposal,
    handleRejectProposal,
    handleCompleteOrder,
    handleCancelOrder,
    handleCancelDistributor,
  }
}
