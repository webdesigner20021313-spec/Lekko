import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useDiscounts } from '@/products/megaprice/stores/useDiscountStore'
import {
  usePurchaseDetail,
  useDistributorsBatch,
  useDrugsCartEnrichment,
  usePurchaseDiff,
} from '@/products/megaprice/api/hooks'
import {
  buildOrderFromPurchaseDetail,
  buildProposalsByDistributor,
} from '@/products/megaprice/pages/orders/adapters'
import type { Order, WholesalerProposal } from '@/products/megaprice/pages/orders/types'

export type DrugInfo = { name: string; producer: string; country: string }

/**
 * Сбор данных страницы деталей заказа: purchase-detail + diff (клиент vs дистр)
 * + batch-обогащение имён дистров и препаратов → готовый Order, proposals и
 * карта distributorId → distributor_order.id. Вынесено из OrderDetailPage,
 * чтобы компонент остался преимущественно render'ом.
 */
export function useOrderDetailData(purchaseId: number) {
  const validId = Number.isFinite(purchaseId) && purchaseId > 0 ? purchaseId : null
  const detailQuery = usePurchaseDetail(validId)
  const drugStore = useAuthStore(s => s.drugStore)
  // Персональные скидки аптеки — автозагрузка в shared store (нужны для UI и PDF/Excel).
  useDiscounts()

  const apiPurchase = detailQuery.data?.purchase ?? null
  // useMemo для стабильной ссылки массивов — иначе зависящие useMemo
  // (distributorIds/drugIds/rawOrder) пересчитываются на каждый рендер.
  const apiOrders = useMemo(() => detailQuery.data?.orders ?? [], [detailQuery.data])
  const apiItems = useMemo(() => detailQuery.data?.items ?? [], [detailQuery.data])

  // Batch-обогащение: distributor names.
  const distributorIds = useMemo(
    () => Array.from(new Set(apiOrders.map(o => o.distributorId).filter(Boolean))),
    [apiOrders],
  )
  const distrIdsKey = distributorIds.slice().sort((a, b) => a - b).join(',')
  const distributors = useDistributorsBatch()
  useEffect(() => {
    if (distributorIds.length > 0) distributors.appendData({ ids: distributorIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distrIdsKey])
  const distrNameById = useMemo(() => {
    const m = new Map<number, string>()
    const list = Array.isArray(distributors.data) ? distributors.data : []
    list.forEach(d => m.set(d.id, d.name))
    return m
  }, [distributors.data])

  // Phase 5: diff клиентской копии vs distributor-копии — нужен здесь, чтобы
  // добавить drugIds распределительных позиций (added/replacement) в batch
  // enrichment (иначе они отрендерятся как "Drug 76").
  const diffQuery = usePurchaseDiff(validId)

  // Все drug_ids которые нужно резолвить: client-items + distributor-items
  // (added) + replacement-drug-id (substitute).
  const drugIds = useMemo(() => {
    const ids = new Set<number>()
    apiItems.forEach((it) => { if (it.drugId) ids.add(Number(it.drugId)) })
    const distrItems = diffQuery.data?.distributor?.items ?? []
    distrItems.forEach((it) => {
      if (it.drugId) ids.add(Number(it.drugId))
      if (it.replacementDrugId) ids.add(Number(it.replacementDrugId))
    })
    return Array.from(ids)
  }, [apiItems, diffQuery.data])
  const drugIdsKey = drugIds.slice().sort((a, b) => a - b).join(',')
  const drugs = useDrugsCartEnrichment()
  useEffect(() => {
    if (drugIds.length > 0) drugs.appendData({ ids: drugIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugIdsKey])
  const drugInfoById = useMemo(() => {
    const m = new Map<number, DrugInfo>()
    const list = Array.isArray(drugs.data) ? drugs.data : []
    list.forEach(d => m.set(d.id, {
      name: d.fullName,
      producer: d.producerName ?? '',
      country: d.countryName ?? '',
    }))
    return m
  }, [drugs.data])

  const rawOrder = useMemo<Order | null>(() => {
    if (!apiPurchase) return null
    return buildOrderFromPurchaseDetail({
      purchase: apiPurchase,
      orders: apiOrders,
      items: apiItems,
      distributorNameById: distrNameById,
      drugInfoById,
      pharmacyName: drugStore?.drugStoreName ?? null,
      pharmacyAddress: drugStore?.address ?? null,
      pharmacyCity: null,
    })
  }, [apiPurchase, apiOrders, apiItems, distrNameById, drugInfoById, drugStore])

  const proposalsByDistributor = useMemo(() => {
    const distr = diffQuery.data?.distributor
    const client = diffQuery.data?.client
    if (!distr || !client) return new Map<string, WholesalerProposal>()
    return buildProposalsByDistributor({
      distributorOrders: distr.orders ?? [],
      distributorItems: distr.items ?? [],
      clientItems: client.items ?? [],
      drugInfoById,
    })
  }, [diffQuery.data, drugInfoById])

  // Карта distributorId → distributor_order.id — нужна для per-distributor
  // accept/reject/cancel (без неё фронт не знает какой distributor_order адресовать).
  const distrOrderIdByDistributorId = useMemo(() => {
    const m = new Map<string, number>()
    ;(diffQuery.data?.distributor?.orders ?? []).forEach((o) => {
      m.set(String(o.distributorId), o.id)
    })
    return m
  }, [diffQuery.data])

  function refetch() {
    detailQuery.refetch?.()
    diffQuery.refetch?.()
  }

  return {
    isLoading: detailQuery.isLoading,
    rawOrder,
    proposalsByDistributor,
    distrOrderIdByDistributorId,
    drugInfoById,
    refetch,
  }
}
