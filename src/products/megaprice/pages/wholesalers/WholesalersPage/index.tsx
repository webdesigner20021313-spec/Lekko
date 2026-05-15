import { useState, useMemo, useCallback, useEffect } from 'react'
import { Search, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Pagination } from '@/shared/ui-kit/Pagination'
import { LoadingOverlay } from '@/shared/ui-kit/LoadingOverlay'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { api } from '@/shared/api/client'
import {
  useDistributorsBatch,
  useDistributorsPaged,
} from '@/products/megaprice/api/hooks'
import type { Wholesaler } from '@/products/megaprice/mocks/wholesalers.mocks'
import { refetchDiscounts, useDiscounts } from '@/products/megaprice/stores/useDiscountStore'
import { DiscountModal } from './DiscountModal'
import { WholesalerCardMobile } from './WholesalerCardMobile'
import { WholesalersTable } from './WholesalersTable'

const PAGE_SIZE = 30

export function WholesalersPage() {
  const { t } = useTranslation()
  const drugStoreId = useAuthStore(s => s.drugStore?.drugStoreId ?? null)

  // Shared discount-store (по distributorId). Cart/Offers подписаны на тот же стор —
  // mutation здесь автоматом обновляет цены везде.
  useDiscounts() // триггерит fetch на mount

  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const debouncedSearch = useDebouncedValue(search, 300)

  // Сброс page при смене query.
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const distributorsQuery = useDistributorsPaged({
    query: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
    drugStoreId,
  })

  // Batch-обогащение видимой страницы: phone/telegram/inn/minOrderAmount/...
  const pagedItems = distributorsQuery.data?.items ?? []
  const pageIds = useMemo(() => pagedItems.map(d => d.id), [pagedItems])
  const pageIdsKey = pageIds.slice().sort((a, b) => a - b).join(',')
  const distributorsFull = useDistributorsBatch()
  useEffect(() => {
    if (pageIds.length > 0) distributorsFull.appendData({ ids: pageIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdsKey])
  const fullById = useMemo(() => {
    const m = new Map<number, NonNullable<typeof distributorsFull.data>[number]>()
    const list = Array.isArray(distributorsFull.data) ? distributorsFull.data : []
    list.forEach(d => m.set(d.id, d))
    return m
  }, [distributorsFull.data])

  // Скидки берём из shared store (useDiscounts triggers fetch выше).
  const { getDiscount: getDiscountFor } = useDiscounts()

  // Adapter DistributorRef + personal-discount + full → UI Wholesaler.
  // Phone берём из contacts (в БД phone обычно null, телефон лежит в contacts).
  // City — из note или regionName.
  const wholesalers = useMemo<Wholesaler[]>(() => {
    return pagedItems.map((d): Wholesaler => {
      const full = fullById.get(d.id)
      const phone = (full?.contacts ?? full?.phone ?? '').trim()
      const tg = full?.telegramIdFirst
      return {
        id: String(d.id),
        name: d.name,
        city: full?.note?.trim() || d.regionName || '',
        phone,
        telegram: tg ? `@${tg}` : null,
        inn: full?.inn ?? '',
        minOrderSum: Number(full?.minOrderAmount ?? 0),
        deliveryDays: Number(full?.deliveryDays ?? 0),
        categories: [],
        discountPercent: getDiscountFor(d.id),
        isActive: d.statusId === 1,
      }
    })
  }, [pagedItems, fullById, getDiscountFor])

  const totalCount = distributorsQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const [modalWholesaler, setModalWholesaler] = useState<Wholesaler | null>(null)

  // Save/Delete вызываем напрямую через axios — у DELETE нужны query params,
  // а универсальный useQueryApiClient тут не подходит. Refetch скидок после.
  const handleSave = useCallback(async (value: string) => {
    if (!modalWholesaler || !drugStoreId) return
    const distributorId = Number(modalWholesaler.id)
    const parsed = parseFloat(value)
    const isClear = !value.trim() || isNaN(parsed) || parsed <= 0

    try {
      if (isClear) {
        await api.delete('/api/drugsearch/personal-discounts', {
          params: { drugStoreId, distributorId },
        })
      } else {
        await api.post('/api/drugsearch/personal-discounts', {
          drugStoreId,
          distributorId,
          discountPercent: parsed,
        })
      }
      void refetchDiscounts()
    } finally {
      setModalWholesaler(null)
    }
  }, [modalWholesaler, drugStoreId])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">

      {/* ── Шапка ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4 dark:border-gray-700 dark:bg-[#111111]">
        <div className="md:flex md:items-center md:justify-between">
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('ws_title')}</h1>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-[#222222] dark:text-gray-400">
                {totalCount}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-400 dark:text-[#929292]">{t('ws_subtitle')}</p>
          </div>

          {/* Mobile title row */}
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('ws_title')}</h1>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-[#222222] dark:text-gray-400">
              {wholesalers.length}
            </span>
          </div>

          <div className="relative md:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('ws_search_ph')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-base placeholder-gray-400 focus:border-gray-400 focus:outline-none md:h-9 md:rounded-lg md:pl-9 md:text-sm dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* ── Таблица ── */}
      <div className="relative min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#111111]">
        <LoadingOverlay show={distributorsQuery.isLoading} label="Загрузка списка…" />
        {wholesalers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#222222]">
              <Package className="h-5 w-5 text-gray-400 dark:text-[#929292]" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('ws_no_results')}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-[#929292]">{t('ws_no_results_hint')}</p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-gray-100 dark:divide-[#333333]">
              {wholesalers.map((w) => (
                <WholesalerCardMobile
                  key={w.id}
                  wholesaler={w}
                  onOpenDiscount={() => setModalWholesaler(w)}
                />
              ))}
            </div>

            <WholesalersTable
              wholesalers={wholesalers}
              page={page}
              pageSize={PAGE_SIZE}
              onOpenDiscount={setModalWholesaler}
            />
          </>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalCount > 0 && totalPages > 1 && (
        <div className="shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            hasPrevious={page > 1}
            hasNext={page < totalPages}
            isLoading={distributorsQuery.isLoading}
            onChange={setPage}
          />
        </div>
      )}

      {/* ── Modal ── */}
      {modalWholesaler && (
        <DiscountModal
          wholesaler={modalWholesaler}
          initialValue={modalWholesaler.discountPercent !== null ? String(modalWholesaler.discountPercent) : ''}
          onSave={handleSave}
          onClose={() => setModalWholesaler(null)}
        />
      )}
    </div>
  )
}
