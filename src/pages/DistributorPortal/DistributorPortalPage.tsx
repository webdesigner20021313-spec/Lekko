import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Package, Plus, Trash2, ArrowLeftRight, ChevronLeft, ChevronDown,
  Send, Search, Building2, MapPin, X,
} from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import {
  useDistributorOrdersList,
  useDistributorOrderDetail,
  useUpdateItem,
  useAddItem,
  useRemoveItem,
  useUpdateStatus,
  useDistributorsAll,
  useDrugStoresBatch,
  useDrugsEnrichment,
  DISTR_ORDER_STATUS,
  type ApiDistributorOrder,
  type ApiDistributorOrderItem,
  type ApiDistributorBrief,
  type ApiDrugStoreBrief,
  type ApiDrugBrief,
} from './api/hooks'
import { ItemPicker } from './ItemPicker'

// Временная страница (см. ТЗ): /distributor-portal?id=<distributorId>, без логина.
// Backend контроллеры [AllowAnonymous]. Когда понадобится прод — заменим на JWT.

const STATUS_LABEL: Record<number, string> = {
  10: 'Новый',
  11: 'На проверке у клиента',
  12: 'Подтверждён',
  13: 'Отклонён',
  14: 'Отгружен',
  15: 'Доставлен',
}

const STATUS_BADGE: Record<number, string> = {
  10: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  11: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  12: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  13: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  14: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  15: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

function fmtMoney(n: number) {
  return n.toLocaleString('ru-RU') + ' UZS'
}

function drugStoreLabel(ds: ApiDrugStoreBrief | undefined, fallbackId: number) {
  if (!ds) return `Аптека #${fallbackId}`
  return ds.nameRu || ds.nameUz || ds.name || `Аптека #${fallbackId}`
}

// ─── Searchable single-select для дистра ──────────────────────────────────

function DistributorSelect({
  value,
  options,
  onChange,
  isLoading,
}: {
  value: number | null
  options: ApiDistributorBrief[]
  onChange: (id: number) => void
  isLoading: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selected = useMemo(() => options.find((d) => d.id === value) ?? null, [options, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 100)
    return options
      .filter((d) => d.name.toLowerCase().includes(q) || String(d.id).includes(q))
      .slice(0, 100)
  }, [options, query])

  return (
    <div ref={ref} className="relative w-[360px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:hover:bg-[#222222]"
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <>
              <span className="text-gray-900 dark:text-gray-100">{selected.name}</span>
              <span className="ml-2 text-xs text-gray-400">#{selected.id}</span>
            </>
          ) : (
            <span className="text-gray-400">{isLoading ? 'Загружаем…' : 'Выберите дистрибьютора'}</span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#111111]">
          <div className="flex h-10 items-center gap-2 border-b border-gray-100 px-3 dark:border-gray-700">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию или id…"
              className="h-full flex-1 bg-transparent text-sm focus:outline-none dark:text-gray-200"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Ничего не найдено</p>
            ) : (
              filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { onChange(d.id); setOpen(false); setQuery('') }}
                  className={cn(
                    'flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#222222]',
                    d.id === value && 'bg-gray-50 dark:bg-[#222222]',
                  )}
                >
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">{d.name}</p>
                    {d.note && <p className="truncate text-xs text-gray-400">{d.note}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">#{d.id}</span>
                </button>
              ))
            )}
          </div>
          {!query && options.length > 100 && (
            <p className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400 dark:border-gray-700">
              Показано 100 из {options.length}. Введите запрос для фильтра.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Главный компонент ────────────────────────────────────────────────────

export function DistributorPortalPage() {
  const [params, setParams] = useSearchParams()
  const distributorId = Number(params.get('id')) || null
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const distrApi = useDistributorsAll()
  const distrList = (distrApi.data as { items?: ApiDistributorBrief[] })?.items ?? []
  const distrById = useMemo(() => {
    const m = new Map<number, ApiDistributorBrief>()
    distrList.forEach((d) => m.set(d.id, d))
    return m
  }, [distrList])
  const selectedDistr = distributorId ? distrById.get(distributorId) ?? null : null

  function selectDistributor(id: number) {
    const next = new URLSearchParams(params)
    next.set('id', String(id))
    setParams(next)
    setSelectedOrderId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Глобальная шапка с селектом дистра — присутствует и в списке, и в детали. */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-[#111111]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Кабинет дистрибьютора</h1>
            {selectedDistr ? (
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">{selectedDistr.name}</span>
                {selectedDistr.note && <> · {selectedDistr.note}</>}
                <> · id {selectedDistr.id}</>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-gray-400">Выберите дистрибьютора для работы с заказами</p>
            )}
          </div>
          <DistributorSelect
            value={distributorId}
            options={distrList}
            onChange={selectDistributor}
            isLoading={distrApi.isLoading}
          />
        </div>
      </header>

      {!distributorId ? (
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Выберите дистрибьютора в селекте справа</p>
        </div>
      ) : selectedOrderId ? (
        <OrderDetail
          distributorId={distributorId}
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
        />
      ) : (
        <OrdersList distributorId={distributorId} onOpen={setSelectedOrderId} />
      )}
    </div>
  )
}

// ─── Список заказов ────────────────────────────────────────────────────────

function OrdersList({ distributorId, onOpen }: { distributorId: number; onOpen: (id: number) => void }) {
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const api = useDistributorOrdersList(distributorId, statusFilter)
  const orders = (Array.isArray(api.data) ? api.data : []) as ApiDistributorOrder[]

  // Резолв drug_store_id → name через batch.
  const storesApi = useDrugStoresBatch()
  const storeIds = useMemo(
    () => Array.from(new Set(orders.map((o) => o.drugStoreId).filter(Boolean))),
    [orders],
  )
  const storeIdsKey = storeIds.slice().sort((a, b) => a - b).join(',')
  useEffect(() => {
    if (storeIds.length > 0) storesApi.appendData({ ids: storeIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeIdsKey])
  const storeById = useMemo(() => {
    const m = new Map<number, ApiDrugStoreBrief>()
    const list = Array.isArray(storesApi.data) ? storesApi.data : []
    list.forEach((s) => m.set(s.id, s))
    return m
  }, [storesApi.data])

  const counts = useMemo(() => {
    const map: Record<number, number> = {}
    orders.forEach((o) => { map[o.statusId] = (map[o.statusId] ?? 0) + 1 })
    return map
  }, [orders])

  const FILTERS: Array<{ label: string; status: number | null }> = [
    { label: 'Все', status: null },
    { label: STATUS_LABEL[10], status: 10 },
    { label: STATUS_LABEL[11], status: 11 },
    { label: STATUS_LABEL[12], status: 12 },
    { label: STATUS_LABEL[14], status: 14 },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setStatusFilter(f.status)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                statusFilter === f.status
                  ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:bg-[#222222]',
              )}
            >
              {f.label}{f.status !== null && counts[f.status] ? ` (${counts[f.status]})` : ''}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Всего: {orders.length}</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#222222]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Клиент</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Статус</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Позиций</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Сумма</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Дата</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {api.isLoading && orders.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-sm text-gray-400">Загружаем…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-sm text-gray-400">Нет заказов</td></tr>
            ) : (
              orders.map((o) => {
                const store = storeById.get(o.drugStoreId)
                return (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-[#222222]">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{o.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{drugStoreLabel(store, o.drugStoreId)}</p>
                          {store?.address && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {store.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        STATUS_BADGE[o.statusId] ?? 'bg-gray-100 text-gray-700',
                      )}>
                        {STATUS_LABEL[o.statusId] ?? `#${o.statusId}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{o.itemsCount}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmtMoney(Number(o.totalSum))}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(o.createDate).toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onOpen(o.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-[#222222]"
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Детали заказа + редактирование ────────────────────────────────────────

function OrderDetail({
  distributorId,
  orderId,
  onBack,
}: {
  distributorId: number
  orderId: number
  onBack: () => void
}) {
  const detail = useDistributorOrderDetail(orderId)
  const order = (detail.data as { order?: ApiDistributorOrder })?.order ?? null
  const items = (detail.data as { items?: ApiDistributorOrderItem[] })?.items ?? []

  // Резолв drug_id → name через cart-enrichment.
  const drugsApi = useDrugsEnrichment()
  const drugIds = useMemo(() => {
    const set = new Set<number>()
    items.forEach((it) => {
      if (it.drugId) set.add(it.drugId)
      if (it.replacementDrugId) set.add(it.replacementDrugId)
    })
    return Array.from(set)
  }, [items])
  const drugIdsKey = drugIds.slice().sort((a, b) => a - b).join(',')
  useEffect(() => {
    if (drugIds.length > 0) drugsApi.appendData({ ids: drugIds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugIdsKey])
  const drugById = useMemo(() => {
    const m = new Map<number, ApiDrugBrief>()
    const list = Array.isArray(drugsApi.data) ? drugsApi.data : []
    list.forEach((d) => m.set(d.id, d))
    return m
  }, [drugsApi.data])

  // Резолв drugStore (только текущей аптеки).
  const storesApi = useDrugStoresBatch()
  useEffect(() => {
    if (order?.drugStoreId) storesApi.appendData({ ids: [order.drugStoreId] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.drugStoreId])
  const storeBrief = (Array.isArray(storesApi.data) ? storesApi.data : [])[0] as ApiDrugStoreBrief | undefined

  // Локальные правки.
  const [drafts, setDrafts] = useState<Record<number, { quantity?: number; price?: number; replacementDrugId?: number | '' }>>({})
  const [newItems, setNewItems] = useState<Array<{ drugId: number | ''; quantity: number | ''; price: number | '' }>>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDrafts({})
    setNewItems([])
    setError(null)
  }, [orderId])

  const updateApi = useUpdateItem()
  const addApi = useAddItem()
  const removeApi = useRemoveItem()
  const statusApi = useUpdateStatus(() => { detail.refetch() }, (m) => setError(m))

  function setDraft(itemId: number, patch: Partial<{ quantity: number; price: number; replacementDrugId: number | '' }>) {
    setDrafts((d) => ({ ...d, [itemId]: { ...d[itemId], ...patch } }))
  }

  async function handleSaveAndSubmit() {
    if (!order) return
    setBusy(true)
    setError(null)
    try {
      for (const [idStr, patch] of Object.entries(drafts)) {
        const itemId = Number(idStr)
        const body: Record<string, unknown> = {}
        if (patch.quantity !== undefined) body.quantity = patch.quantity
        if (patch.price !== undefined) body.price = patch.price
        if (patch.replacementDrugId !== undefined && patch.replacementDrugId !== '') {
          body.replacementDrugId = Number(patch.replacementDrugId)
        }
        if (Object.keys(body).length === 0) continue
        updateApi.appendData(body, { itemId })
        await new Promise((r) => setTimeout(r, 250))
      }
      for (const n of newItems) {
        if (!n.drugId || !n.quantity) continue
        const body: Record<string, unknown> = { drugId: Number(n.drugId), quantity: Number(n.quantity) }
        if (n.price !== '') body.price = Number(n.price)
        addApi.appendData(body, { orderId: order.id })
        await new Promise((r) => setTimeout(r, 250))
      }
      statusApi.appendData({ statusId: DISTR_ORDER_STATUS.modified, comment: null }, { orderId: order.id })
      setDrafts({})
      setNewItems([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setBusy(false)
    }
  }

  function handleRemove(itemId: number) {
    removeApi.appendData(undefined, { itemId })
    setTimeout(() => detail.refetch(), 400)
  }

  if (!order && detail.isLoading) {
    return <div className="mx-auto max-w-6xl p-8 text-sm text-gray-500">Загружаем…</div>
  }
  if (!order) {
    return <div className="mx-auto max-w-6xl p-8 text-sm text-gray-500">Заказ не найден</div>
  }

  const editable = order.statusId === DISTR_ORDER_STATUS.pending || order.statusId === DISTR_ORDER_STATUS.modified
  const visibleItems = items.filter((it) => !it.isRemoved)

  return (
    <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-[#222222]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs text-gray-400">Заказ #{order.id} · покупка клиента #{order.purchaseOrderId}</p>
              <h2 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                {drugStoreLabel(storeBrief, order.drugStoreId)}
              </h2>
              {storeBrief?.address && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3 w-3" /> {storeBrief.address}
                </p>
              )}
            </div>
          </div>
          <span className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
            STATUS_BADGE[order.statusId] ?? 'bg-gray-100 text-gray-700',
          )}>
            {STATUS_LABEL[order.statusId] ?? `#${order.statusId}`}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Items */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="h-4 w-4" /> Позиции ({visibleItems.length})
          </h2>
          {editable && (
            <button
              onClick={() => setNewItems((arr) => [...arr, { drugId: '', quantity: 1, price: '' }])}
              className="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900"
            >
              <Plus className="h-3.5 w-3.5" /> Добавить позицию
            </button>
          )}
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#222222]">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Препарат</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Кол-во</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Цена</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Замена</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Флаги</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
            {visibleItems.map((it) => {
              const draft = drafts[it.id] ?? {}
              const qty = draft.quantity ?? it.quantity
              const price = draft.price ?? Number(it.price ?? 0)
              const replacement = draft.replacementDrugId !== undefined ? draft.replacementDrugId : (it.replacementDrugId ?? '')
              const drug = drugById.get(it.drugId)
              const replacementDrug = typeof replacement === 'number' ? drugById.get(replacement) : undefined
              return (
                <tr key={it.id}>
                  <td className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{drug?.fullName ?? `drug #${it.drugId}`}</p>
                    <p className="text-xs text-gray-400">{drug?.producerName ?? ''}{drug?.countryName ? ` · ${drug.countryName}` : ''}</p>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={qty}
                      disabled={!editable}
                      onChange={(e) => setDraft(it.id, { quantity: Number(e.target.value) })}
                      className="h-8 w-20 rounded border border-gray-200 bg-white px-2 text-right text-sm dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      disabled={!editable}
                      onChange={(e) => setDraft(it.id, { price: Number(e.target.value) })}
                      className="h-8 w-28 rounded border border-gray-200 bg-white px-2 text-right text-sm dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-start gap-1">
                      <ArrowLeftRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        {editable ? (
                          <ItemPicker
                            distributorId={distributorId}
                            selectedDrugId={typeof replacement === 'number' ? replacement : null}
                            buttonLabel={replacementDrug ? 'Сменить' : 'Выбрать'}
                            onSelect={(picked) => {
                              if (picked.drugId == null) {
                                setError(`«${picked.itemName}» не привязан к справочнику — выберите linked-позицию`)
                                return
                              }
                              setError(null)
                              setDraft(it.id, { replacementDrugId: picked.drugId })
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {replacementDrug && (
                          <div className="mt-1 flex items-center gap-1">
                            <p className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-300">{replacementDrug.fullName}</p>
                            {editable && (
                              <button
                                onClick={() => setDraft(it.id, { replacementDrugId: '' })}
                                className="shrink-0 text-gray-400 hover:text-red-500"
                                title="Убрать замену"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {it.isAdded ? <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">added</span> : null}{' '}
                    {it.isModified ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">modified</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editable && (
                      <button
                        onClick={() => handleRemove(it.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        title="Удалить позицию"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {/* Новые позиции — ещё не отправлены */}
            {newItems.map((n, idx) => {
              const drug = typeof n.drugId === 'number' ? drugById.get(n.drugId) : undefined
              const newPickerLabel = drug ? 'Сменить' : 'Выбрать препарат'
              return (
                <tr key={`new-${idx}`} className="bg-blue-50/40 dark:bg-blue-900/10">
                  <td className="px-3 py-2">
                    <ItemPicker
                      distributorId={distributorId}
                      selectedDrugId={typeof n.drugId === 'number' ? n.drugId : null}
                      buttonLabel={newPickerLabel}
                      onSelect={(picked) => {
                        if (picked.drugId == null) {
                          setError(`«${picked.itemName}» не привязан к справочнику — backend требует drug_id. Выберите linked-позицию.`)
                          return
                        }
                        setError(null)
                        setNewItems((arr) => arr.map((x, i) => i === idx ? {
                          ...x,
                          drugId: picked.drugId as number,
                          price: x.price === '' ? Number(picked.price) : x.price,
                        } : x))
                      }}
                    />
                    {drug && <p className="mt-1 truncate text-[11px] text-gray-700 dark:text-gray-300">{drug.fullName}</p>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={1}
                      value={n.quantity}
                      onChange={(e) => setNewItems((arr) => arr.map((x, i) => i === idx ? { ...x, quantity: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                      className="h-8 w-20 rounded border border-gray-200 bg-white px-2 text-right text-sm dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={n.price}
                      onChange={(e) => setNewItems((arr) => arr.map((x, i) => i === idx ? { ...x, price: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                      className="h-8 w-28 rounded border border-gray-200 bg-white px-2 text-right text-sm dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200"
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">—</td>
                  <td className="px-3 py-2 text-xs">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">new</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setNewItems((arr) => arr.filter((_, i) => i !== idx))}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editable && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveAndSubmit}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60 dark:bg-[#f1f1f1] dark:text-gray-900"
          >
            <Send className="h-4 w-4" />
            {busy ? 'Отправляем…' : 'Сохранить и отправить клиенту на проверку'}
          </button>
        </div>
      )}
    </main>
  )
}
