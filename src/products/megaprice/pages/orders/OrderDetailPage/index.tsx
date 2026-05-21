import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, Wallet,
  Download, FileText, CheckCircle2, XCircle,
  AlertCircle, Check, X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency, formatDateTime } from '@/shared/utils/format'
import { useDiscounts } from '@/products/megaprice/stores/useDiscountStore'
import {
  downloadInvoicePdf,
  downloadInvoiceXlsx,
} from '@/products/megaprice/api/invoice'
import { mp } from '@/products/megaprice/utils/path'
import {
  type Order,
  type OrderDistributorGroup,
  type WholesalerProposal,
} from '@/products/megaprice/pages/orders/types'
import { ConfirmModal } from './ConfirmModal'
import { DistributorCard } from './DistributorCard'
import { GlobalStatusBadge } from './GlobalStatusBadge'
import { HistoryModal } from './HistoryModal'
import { InfoCard } from './InfoCard'
import { buildFullPayload, buildGroupPayload, type ModalState } from './payload'
import { useOrderDetailData } from './useOrderDetailData'
import { useOrderActions } from './useOrderActions'

// ─── Order Detail Page (entry) ────────────────────────────────────────────────

export function OrderDetailPage() {
  const { t } = useTranslation()
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  // id в URL = purchaseId. Сбор данных (detail + diff + обогащение) — в useOrderDetailData.
  const purchaseId = Number(id)
  const {
    isLoading,
    rawOrder,
    proposalsByDistributor,
    distrOrderIdByDistributorId,
    drugInfoById,
    refetch,
  } = useOrderDetailData(purchaseId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">{t('orders_loading') ?? 'Загрузка…'}</p>
      </div>
    )
  }

  if (!rawOrder) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-[#111111]">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('orders_not_found')}</p>
        <button
          onClick={() => navigate(mp('/orders'))}
          className="mt-3 text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {t('orders_back_list')}
        </button>
      </div>
    )
  }

  return (
    <OrderDetailContent
      key={rawOrder.id}
      order={rawOrder}
      purchaseId={purchaseId}
      proposalsByDistributor={proposalsByDistributor}
      distrOrderIdByDistributorId={distrOrderIdByDistributorId}
      drugInfoById={drugInfoById}
      onRefetchDetail={refetch}
    />
  )
}

// ─── Order Detail Content ─────────────────────────────────────────────────────

function OrderDetailContent({
  order: initialOrder,
  purchaseId,
  proposalsByDistributor,
  distrOrderIdByDistributorId,
  drugInfoById,
  onRefetchDetail,
}: {
  order: Order
  purchaseId: number
  proposalsByDistributor: Map<string, WholesalerProposal>
  distrOrderIdByDistributorId: Map<string, number>
  drugInfoById: Map<number, { name: string; producer: string; country: string }>
  onRefetchDetail: () => void
}) {
  const { t } = useTranslation()
  const navigate      = useNavigate()
  // Персональные скидки — shared store, hook реактивный (для UI DistributorCard).
  const { getDiscount } = useDiscounts()

  // Сливаем proposals + distrOrderId из diff в order.groups.
  const orderWithProposals = useMemo<Order>(() => {
    if (proposalsByDistributor.size === 0 && distrOrderIdByDistributorId.size === 0) return initialOrder
    return {
      ...initialOrder,
      groups: initialOrder.groups.map((g) => {
        const proposal = proposalsByDistributor.get(g.distributorId)
        const distOrderId = distrOrderIdByDistributorId.get(g.distributorId)
        const patched: OrderDistributorGroup = {
          ...g,
          distributorOrderId: distOrderId,
        }
        if (proposal) {
          patched.distributorStatus = 'offer'
          patched.proposal = proposal
        }
        return patched
      }),
    }
  }, [initialOrder, proposalsByDistributor, distrOrderIdByDistributorId])

  const [order, setOrder] = useState<Order>(orderWithProposals)
  const [modal, setModal] = useState<ModalState | null>(null)

  // Если родительский raw-order пришёл с обновлёнными items (после fetch'а
  // useOrderItems) — переинициализируем local state. Без этого юзер видел бы
  // старый snapshot без items.
  useEffect(() => {
    setOrder(orderWithProposals)
  }, [orderWithProposals])

  const isOrderActive = order.status === 'new' || order.status === 'modified'
  const totalItems    = order.groups.reduce((s, g) => s + g.items.length, 0)
  const hasProposals  = order.groups.some(g => g.distributorStatus === 'offer')

  // Действия (accept/reject/cancel per-distributor и all) вынесены в useOrderActions.
  const {
    proposalBusy,
    handleAcceptProposal,
    handleRejectProposal,
    handleCompleteOrder,
    handleCancelOrder,
    handleCancelDistributor,
  } = useOrderActions({
    purchaseId,
    order,
    setOrder,
    closeModal: () => setModal(null),
    onRefetchDetail,
  })

  const distCountLabel = order.groups.length === 1
    ? t('orders_n_dist_1')
    : t('orders_n_dist_many', { n: order.groups.length })

  const proposalCount = order.groups.filter(g => g.distributorStatus === 'offer').length

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-3 md:px-6 md:py-4 dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate(mp('/orders'))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <h1 className="font-mono text-base font-bold text-gray-900 md:text-xl dark:text-gray-100">{order.number}</h1>
            <GlobalStatusBadge status={order.status} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => downloadInvoicePdf(purchaseId, buildFullPayload(order))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 md:w-auto md:gap-1.5 md:px-3 md:text-sm md:font-medium dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={t('orders_invoice_btn')}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">{t('orders_invoice_btn')}</span>
            </button>
            <button
              onClick={() => downloadInvoiceXlsx(purchaseId, buildFullPayload(order))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-green-600 bg-green-600 text-white transition-colors hover:border-green-700 hover:bg-green-700 md:w-auto md:gap-1.5 md:px-3 md:text-sm md:font-medium"
              aria-label="Excel"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={cn('min-h-0 flex-1 overflow-y-auto bg-gray-50/40 px-3 py-4 md:px-6 md:py-5 dark:bg-[#111111]', isOrderActive && 'pb-32 md:pb-24')}>
        <div className="mx-auto max-w-4xl space-y-4">

          {/* Info cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoCard
              icon={<MapPin className="h-4 w-4" />}
              label={t('orders_info_pharmacy')}
              value={order.pharmacyName}
              sub={`${order.pharmacyAddress}, ${order.pharmacyCity}`}
            />
            <InfoCard
              icon={<Calendar className="h-4 w-4" />}
              label={t('orders_info_created')}
              value={formatDateTime(order.createdAt)}
              sub={distCountLabel}
            />
            <InfoCard
              icon={<Wallet className="h-4 w-4" />}
              label={t('orders_info_total')}
              value={formatCurrency(order.totalSum)}
              sub={t('orders_units_pos', { qty: order.totalQty, pos: totalItems })}
            />
          </div>

          {/* Proposals banner */}
          {hasProposals && isOrderActive && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 dark:border-[#78350F]/40 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {proposalCount === 1
                  ? t('orders_proposal_banner_1')
                  : t('orders_proposal_banner_n', { n: proposalCount })
                }
              </p>
            </div>
          )}

          {/* Completed / Cancelled state */}
          {order.status === 'completed' && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-[#064E3B]/40 dark:bg-green-900/20">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('orders_completed_msg')}</p>
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-[#7F1D1D]/40 dark:bg-red-900/20">
              <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{t('orders_cancelled_msg')}</p>
            </div>
          )}

          {/* Distributor cards */}
          {order.groups.map(group => (
            <DistributorCard
              key={group.distributorId}
              group={group}
              isOrderActive={isOrderActive}
              discountPercent={getDiscount(group.distributorId)}
              onCancelOrder={() => setModal({
                kind: 'cancel_distributor',
                distributorId: group.distributorId,
                distributorName: group.distributorName,
              })}
              onAcceptProposal={() => handleAcceptProposal(group.distributorId)}
              onRejectProposal={() => handleRejectProposal(group.distributorId)}
              onDownloadExcel={() => downloadInvoiceXlsx(purchaseId, buildGroupPayload(group, order))}
              onDownloadPdf={() => downloadInvoicePdf(purchaseId, buildGroupPayload(group, order))}
              onOpenHistory={() => {
                if (group.distributorOrderId) {
                  setModal({
                    kind: 'history',
                    distributorOrderId: group.distributorOrderId,
                    distributorName: group.distributorName,
                  })
                }
              }}
              isBusy={proposalBusy}
            />
          ))}

        </div>
      </div>

      {/* ── Fixed bottom action bar — выше таб-бара на мобиле ──
        * Глобальный «Отменить заказ» показываем только если есть ХОТЯ БЫ
        * один дистр, который ещё можно отменить (не accepted, не cancelled).
        * Принятый заказ отменять нельзя. */}
      {isOrderActive && order.groups.some((g) =>
        g.distributorStatus !== 'accepted' &&
        g.distributorStatus !== 'cancelled' &&
        g.distributorStatus !== 'rejected',
      ) && (
        <div className="fixed bottom-tabbar left-0 right-0 z-40 flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:bottom-0 md:left-[140px] md:justify-end md:gap-4 md:px-6 md:py-4 dark:border-gray-700 dark:bg-[#111111]">
          <button
            onClick={() => setModal({ kind: 'cancel_order' })}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 md:h-9 md:flex-none md:px-4"
          >
            <X className="h-4 w-4" />
            {t('orders_cancel_btn')}
          </button>
          <button
            onClick={() => setModal({ kind: 'complete' })}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-3 text-sm font-semibold text-white transition-colors hover:bg-black md:h-9 md:flex-none md:px-4 dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
          >
            <Check className="h-4 w-4" />
            {t('orders_complete_btn')}
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.kind === 'complete' && (
        <ConfirmModal
          title={t('orders_modal_complete_title')}
          description={t('orders_modal_complete_desc')}
          confirmLabel={t('orders_modal_complete_confirm')}
          backLabel={t('orders_modal_back')}
          onConfirm={handleCompleteOrder}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'cancel_order' && (
        <ConfirmModal
          title={t('orders_modal_cancel_title')}
          description={t('orders_modal_cancel_desc')}
          confirmLabel={t('orders_modal_cancel_confirm')}
          backLabel={t('orders_modal_back')}
          isDanger
          onConfirm={handleCancelOrder}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'cancel_distributor' && (
        <ConfirmModal
          title={t('orders_modal_cancel_dist_title') ?? 'Отменить заказ у дистрибутора?'}
          description={
            t('orders_modal_cancel_dist_desc', { name: modal.distributorName }) ??
            `Будет отменён только заказ у ${modal.distributorName}. Остальные дистрибуторы продолжат работу.`
          }
          confirmLabel={t('orders_modal_cancel_confirm') ?? 'Отменить'}
          backLabel={t('orders_modal_back') ?? 'Назад'}
          isDanger
          onConfirm={() => handleCancelDistributor(modal.distributorId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'history' && (
        <HistoryModal
          distributorOrderId={modal.distributorOrderId}
          distributorName={modal.distributorName}
          order={order}
          drugInfoById={drugInfoById}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
