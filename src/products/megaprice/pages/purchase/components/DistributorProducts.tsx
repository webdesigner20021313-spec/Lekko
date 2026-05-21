import { useEffect, useMemo, useState } from 'react'
import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useAddToCart,
  useCart,
  useDistributorPriceItems,
  useRemoveFromCart,
  useUpdateCartQty,
} from '@/products/megaprice/api/hooks'
import { mapPriceOfferToProduct } from '@/products/megaprice/api/adapters'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { Pagination } from '@/shared/ui-kit/Pagination'
import { QuantityControl } from './SupplierOffers/QuantityControl'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { cn } from '@/shared/utils/utils'
import type { Distributor } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface Props {
  distributor: Distributor | null
}

/**
 * Прайс-лист выбранного дистрибьютора через API.
 *  - GET /api/drugsearch/price-lists/{distributorId}/items — paged.
 *  - Add-to-cart через единый useAddToCart (POST /api/cart/items).
 *  - Поиск/фильтры/сортировка ушли — пользователь хочет server-side; в текущем
 *    бэк-эндпоинте `/price-lists/{id}/items` нет поддержки фильтров. Расширим
 *    при необходимости.
 */
export function DistributorProducts({ distributor }: Props) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)

  const distributorId = distributor ? Number(distributor.id) : null
  const items = useDistributorPriceItems(distributorId, { page, pageSize })

  // Сброс page при смене дистра.
  useEffect(() => {
    setPage(1)
  }, [distributor?.id])

  const products = useMemo(() => {
    const rows = items.data?.items ?? []
    return rows.map(mapPriceOfferToProduct)
  }, [items.data?.items])

  // Корзина — источник правды для qty.
  const cart = useCart()
  const addCart = useAddToCart(cart.refetch)
  const updateCart = useUpdateCartQty(cart.refetch)
  const removeCart = useRemoveFromCart(cart.refetch)

  // Ключ — itemId (id строки прайс-листа дистра). Бэкенд возвращает priceId=null
  // (legacy-поле), его использовать нельзя — карта будет пустой и "+1" зациклится
  // на addCart, который зарежется in-flight dedup'ом.
  const cartByItemId = useMemo(() => {
    const map = new Map<string, { id: number; quantity: number }>()
    cart.data?.items?.forEach((it) => {
      if (it.itemId !== null && it.itemId !== undefined) {
        map.set(String(it.itemId), { id: it.id, quantity: it.quantity })
      }
    })
    return map
  }, [cart.data?.items])

  const quantities = useMemo(() => {
    const m: Record<string, number> = {}
    cartByItemId.forEach((v, k) => { m[k] = v.quantity })
    return m
  }, [cartByItemId])

  function handleQtyChange(offerId: string, qty: number) {
    const product = products.find((p) => p.offer.id === offerId)
    if (!product?.medicine.drugId) return

    const existing = cartByItemId.get(offerId)

    if (qty <= 0) {
      if (existing) removeCart.appendData({}, { id: existing.id })
      return
    }

    if (existing) {
      updateCart.appendData({ quantity: qty }, { id: existing.id })
    } else {
      addCart.appendData({
        drugStoreId,
        drugId: product.medicine.drugId,
        distributorId: Number(product.offer.distributor.id),
        itemId: Number(product.offer.id),  // id позиции в прайс-листе дистра
        price: product.offer.priceWithVat,
        producerId: null,
        quantity: qty,
      })
    }
  }

  if (!distributor) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-xl bg-gray-100 p-5 dark:bg-[#222222]">
          <Package className="h-10 w-10 text-gray-400 dark:text-[#929292]" />
        </div>
        <div>
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            {t('select_distributor_title')}
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-[#929292]">{t('select_from_left')}</p>
        </div>
      </div>
    )
  }

  const totalPages = items.data
    ? Math.max(1, items.data.totalPages || Math.ceil(items.data.totalCount / pageSize))
    : 1

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header — название дистрибьютора */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#111111]">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{distributor.name}</p>
        {distributor.city && (
          <p className="text-xs text-gray-500 dark:text-[#929292]">{distributor.city}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {items.isLoading && products.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Загрузка…</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">{t('products_empty')}</div>
        ) : (
          <ProductTable products={products} quantities={quantities} onQty={handleQtyChange} startIndex={(page - 1) * pageSize} />
        )}
      </div>

      {items.data && items.data.totalCount > pageSize && (
        <div className="shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
          <Pagination
            page={items.data.pageNumber}
            totalPages={totalPages}
            totalCount={items.data.totalCount}
            pageSize={pageSize}
            hasPrevious={items.data.hasPrevious}
            hasNext={items.data.hasNext}
            isLoading={items.isLoading}
            onChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      )}
    </div>
  )
}

interface ProductTableProps {
  products: ReturnType<typeof mapPriceOfferToProduct>[]
  quantities: Record<string, number>
  onQty: (offerId: string, qty: number) => void
  startIndex?: number
}

function ProductTable({ products, quantities, onQty, startIndex = 0 }: ProductTableProps) {
  const { t } = useTranslation()
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden bg-gray-50 px-3 py-3 dark:bg-[#0a0a0a]">
        <div className="space-y-2.5">
          {products.map(({ offer, medicine }) => {
            const qty = quantities[offer.id] ?? 0
            return (
              <div
                key={offer.id}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white dark:bg-[#111111]',
                  qty > 0 ? 'border-gray-900 dark:border-[#f1f1f1]' : 'border-gray-200 dark:border-gray-700',
                )}
              >
                <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{medicine.name}</p>
                    {medicine.manufacturer && (
                      <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-[#929292]">
                        {medicine.manufacturer}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">
                    {formatCurrency(offer.priceWithVat)}
                  </p>
                </div>
                {offer.expiryDate && (
                  <div className="px-4 pb-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {t('col_expiry')}: {formatDate(offer.expiryDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]">
                    {t('col_quantity')}
                  </span>
                  <QuantityControl value={qty} onChange={(v) => onQty(offer.id, v)} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop table */}
      <table className="hidden md:table" style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: 48 }} />
          <col />
          <col style={{ width: 200 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 200 }} />
        </colgroup>
        <thead>
          <tr style={{ height: 48, background: 'var(--table-header-bg)' }}
            className="border-b border-[var(--table-border)]">
            <Th align="center">№</Th>
            <Th>{t('col_product')}</Th>
            <Th>{t('filter_manufacturer')}</Th>
            <Th align="right">{t('col_expiry')}</Th>
            <Th align="right">{t('col_price_vat')}</Th>
            <Th>{t('col_quantity')}</Th>
          </tr>
        </thead>
        <tbody>
          {products.map(({ offer, medicine }, i) => {
            const qty = quantities[offer.id] ?? 0
            return (
              <tr
                key={offer.id}
                className="border-b border-[var(--table-cell-border)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Td align="center" muted>{startIndex + i + 1}</Td>
                <Td>
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{medicine.name}</p>
                </Td>
                <Td>
                  <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                    {medicine.manufacturer || '—'}
                  </p>
                </Td>
                <Td align="right">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {offer.expiryDate ? formatDate(offer.expiryDate) : '—'}
                  </span>
                </Td>
                <Td align="right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(offer.priceWithVat)}
                  </span>
                </Td>
                <Td>
                  <QuantityControl value={qty} onChange={(v) => onQty(offer.id, v)} />
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className="px-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#929292]"
      style={{ textAlign: align, whiteSpace: 'nowrap' }}
    >
      {children}
    </th>
  )
}

function Td({ children, align = 'left', muted }: {
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  muted?: boolean
}) {
  return (
    <td
      className={cn('px-4 py-3', muted && 'text-xs text-gray-400')}
      style={{ textAlign: align, overflow: 'hidden' }}
    >
      {children}
    </td>
  )
}
