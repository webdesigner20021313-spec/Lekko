import { useState } from 'react'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import {
  useAddToCart,
  useCart,
  useDrugSearch,
  useOffersByDrugId,
  useRemoveFromCart,
} from '@/products/megaprice/api/hooks'
import { Button } from '@/shared/ui-kit/Button'

/**
 * Sandbox-страница для проверки интеграции с ABU-бэкендом.
 * Все запросы идут через единый useQueryApiClient (см. shared/utils).
 */
export function ApiTestPage() {
  const { user, drugStore, license } = useAuthStore()
  const [query, setQuery] = useState('')
  const [pickedDrugId, setPickedDrugId] = useState<number | null>(null)

  // useDrugSearch сам триггерит fetch при изменении props.
  const search = useDrugSearch({
    drugStoreId: drugStore?.drugStoreId ?? null,
    drugName: query,
    pageSize: 15,
  })

  const offers = useOffersByDrugId(pickedDrugId, { pageSize: 20 })

  const cart = useCart()
  const addToCart = useAddToCart(() => cart.refetch())
  const removeFromCart = useRemoveFromCart(() => cart.refetch())

  const searchItems =
    (search.data && 'items' in search.data ? search.data.items : []) ?? []
  const offerItems =
    (offers.data && 'items' in offers.data ? offers.data.items : []) ?? []
  const cartItems =
    (cart.data && 'items' in cart.data ? cart.data.items : []) ?? []

  return (
    <div className="space-y-6 p-6">
      <header className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
        <h1 className="text-lg font-semibold">API sandbox</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user
            ? `Залогинен: ${user.fullName ?? user.login} (id=${user.id})`
            : 'Не залогинен'}
        </p>
        {drugStore && (
          <p className="text-sm text-gray-500">
            Аптека: {drugStore.drugStoreName} (id={drugStore.drugStoreId}, area={drugStore.areaId})
          </p>
        )}
        {license && (
          <p className="text-sm text-gray-500">
            Лицензия: status={license.statusCode}, осталось дней — {license.daysRemains}
          </p>
        )}
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
        <h2 className="mb-3 font-semibold">Поиск препарата</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите название (от 2 символов)..."
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm dark:border-gray-700 dark:bg-[#222]"
        />
        <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-gray-100 dark:border-gray-800">
          {search.isLoading && (
            <p className="px-3 py-2 text-sm text-gray-400">Загрузка…</p>
          )}
          {search.isError && (
            <p className="px-3 py-2 text-sm text-red-500">
              Ошибка поиска
            </p>
          )}
          {!search.isLoading && searchItems.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">Ничего не найдено</p>
          )}
          {searchItems.map((row, idx) => (
            <button
              key={`${row.id}-${idx}`}
              onClick={() => setPickedDrugId(row.id)}
              className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-[#1a1a1a]"
            >
              <span className="truncate">
                {row.fullName}
                {row.producerName ? ` · ${row.producerName}` : ''}
              </span>
              <span className="shrink-0 text-xs text-gray-400">id {row.id}</span>
            </button>
          ))}
        </div>
        {search.data && 'totalCount' in search.data && (
          <p className="mt-2 text-xs text-gray-400">
            Всего: {search.data.totalCount} (стр. {search.data.pageNumber}/
            {search.data.totalPages})
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
        <h2 className="mb-3 font-semibold">
          Цены по drugId {pickedDrugId ?? '— выберите препарат сверху —'}
        </h2>
        <div className="max-h-72 overflow-auto rounded-lg border border-gray-100 dark:border-gray-800">
          {offers.isLoading && (
            <p className="px-3 py-2 text-sm text-gray-400">Загрузка…</p>
          )}
          {!offers.isLoading && offerItems.length === 0 && pickedDrugId !== null && (
            <p className="px-3 py-2 text-sm text-gray-400">Нет предложений</p>
          )}
          {offerItems.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 dark:border-gray-800"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{o.distributorName ?? `Distr ${o.distributorId}`}</p>
                <p className="truncate text-xs text-gray-400">
                  {o.producerName ?? '—'} {o.expireDateStr ? `· до ${o.expireDateStr}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums">{o.price}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    addToCart.appendData({
                      drugStoreId: drugStore?.drugStoreId ?? null,
                      drugId: o.drugId,
                      distributorId: o.distributorId,
                      itemId: o.id,
                      price: o.price,
                      producerId: o.producerId ?? null,
                      quantity: 1,
                    })
                  }
                  disabled={addToCart.isLoading}
                >
                  В корзину
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
        <h2 className="mb-3 font-semibold">
          Корзина {cart.data && 'lineCount' in cart.data
            ? `· ${cart.data.lineCount} строк, итого ${cart.data.total}`
            : ''}
        </h2>
        {cart.isLoading && <p className="text-sm text-gray-400">Загрузка…</p>}
        {!cart.isLoading && cartItems.length === 0 && (
          <p className="text-sm text-gray-400">Пусто</p>
        )}
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {cartItems.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{it.drugName ?? `Drug ${it.drugId}`}</p>
                <p className="truncate text-xs text-gray-400">
                  {it.distributorName ?? `Distr ${it.distributorId}`} · {it.producerName ?? '—'} ·{' '}
                  {it.quantity} × {it.price}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeFromCart.appendData({}, { id: it.id })}
                disabled={removeFromCart.isLoading}
              >
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
