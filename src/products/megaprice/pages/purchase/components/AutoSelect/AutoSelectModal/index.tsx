import { useState, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui-kit/Button'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import {
  useAutoSelect,
  useAddToCartBulk,
  useDistributorsPaged,
  useRegions,
  type AutoSelectItem,
  type AutoSelectOffer,
  type AddCartItemPayload,
  type BulkAddCartResult,
} from '@/products/megaprice/api/hooks'
import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { LoadingStep } from './LoadingStep'
import { ResultsStep } from './ResultsStep'
import { SettingsStep } from './SettingsStep'
import { useAsyncTagState } from './AsyncTagInput/useAsyncTagState'
import { buildAutoSelectResults } from './mapResults'
import type { LocalResult, Settings, TagOption } from './types'

/**
 * Автоподбор офферов:
 *  - POST /api/drugsearch/auto-select → per-drug лучший оффер (бэк сам ходит в Pricing).
 *  - POST /api/cart/items/bulk → добавление matched в корзину одним HTTP.
 *
 * Тонкости:
 *  - Если у выбранных medicines нет drug_id (mock) → сразу no_offers, без HTTP.
 *  - Producer-фильтр работает по строке (имена производителей из Medicine.manufacturer).
 *  - Города в UI → regionIds через справочник useRegions.
 */
export function AutoSelectModal({ medicines, onClose, onAdded }: {
  medicines: Medicine[]
  onClose: () => void
  /** Колбэк после успешного добавления (added — успех, failed — ошибки). */
  onAdded?: (added: number, failed: number) => void
}) {
  const { t } = useTranslation()
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)

  // ── Опции фильтров ──
  const allManufacturers = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of medicines) {
      const manu = (m.manufacturer ?? '').trim()
      if (manu) map.set(manu, m.country ?? '')
    }
    return Array.from(map.entries())
      .map(([name, country]) => ({ name, country }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [medicines])

  // Дистры — серверный поиск + пагинация (infinite scroll).
  // useAsyncTagState управляет query/page/accumulated. useDistributorsPaged
  // вызывается отдельно (правила React-хуков) и feed() складывает результат.
  const distState = useAsyncTagState(30)
  const distApi = useDistributorsPaged({
    query: distState.debouncedQuery,
    page: distState.page,
    pageSize: distState.pageSize,
    drugStoreId,
    activeOnly: true, // в автоподборе нет смысла предлагать архивных дистров
  })
  useEffect(() => {
    distState.feed(
      distApi.data,
      distApi.isLoading,
      (d) => ({ id: String(d.id), label: d.name, sublabel: d.regionName ?? '' }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distApi.data, distApi.isLoading])

  // selectedLabels — отдельный кэш id→label. При infinite scroll или смене query
  // уже выбранный id может не быть на текущей странице — но его подпись нам нужна.
  const [distLabels, setDistLabels] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    if (distState.items.length === 0) return
    setDistLabels((prev) => {
      const next = new Map(prev)
      let changed = false
      distState.items.forEach((opt) => {
        if (!next.has(opt.id)) { next.set(opt.id, opt.label); changed = true }
      })
      return changed ? next : prev
    })
  }, [distState.items])

  const regionsQuery = useRegions()
  const regionNameToId = useMemo(() => {
    const m = new Map<string, number>()
    const list = Array.isArray(regionsQuery.data) ? regionsQuery.data : []
    list.forEach((r) => { if (r.nameRu) m.set(r.nameRu, r.id) })
    return m
  }, [regionsQuery.data])

  const manufacturerOptions = useMemo<TagOption[]>(
    () => allManufacturers.map((m) => ({ id: m.name, label: m.name, sublabel: m.country })),
    [allManufacturers],
  )

  // medicine lookup для маппинга API-ответа.
  const medicineByDrugId = useMemo(() => {
    const m = new Map<number, Medicine>()
    medicines.forEach((med) => {
      if (typeof med.drugId === 'number') m.set(med.drugId, med)
    })
    return m
  }, [medicines])

  // ── Состояние ──
  const [step, setStep] = useState<'settings' | 'loading' | 'results' | 'adding'>('settings')
  const [results, setResults] = useState<LocalResult[]>([])
  const [addError, setAddError] = useState<string | null>(null)

  const [s, setS] = useState<Settings>({
    cityFilter:        [],
    supplierIds:       [],
    manufacturerNames: [],
    priceDeviationPct: '',
    priceAgeDays:      null, // null = «за всё время» (бэк применит свой default ~36500)
  })

  const autoApi = useAutoSelect()
  const bulkApi = useAddToCartBulk()

  // ── Run: дёргаем backend autoselect ──
  function handleRun() {
    if (!drugStoreId) return

    // Соберём только medicines с реальным drug_id. Те, что без drug_id (mock'и
    // или ещё не resolved), сразу попадают в no_offers — без HTTP-вызова.
    const drugIds: number[] = []
    const mockMedicines: Medicine[] = []
    for (const m of medicines) {
      if (typeof m.drugId === 'number' && m.drugId > 0) drugIds.push(m.drugId)
      else mockMedicines.push(m)
    }

    // Если вообще ничего нечего искать — сразу показываем результат.
    if (drugIds.length === 0) {
      setResults(mockMedicines.map((m) => ({ medicine: m, offer: null, reason: 'no_offers' as const })))
      setStep('results')
      return
    }

    setStep('loading')

    const regionIds = s.cityFilter
      .map((name) => regionNameToId.get(name))
      .filter((id): id is number => typeof id === 'number')

    const devPctRaw = s.priceDeviationPct ? parseFloat(s.priceDeviationPct) : NaN
    const devPct = Number.isFinite(devPctRaw) && devPctRaw > 0 ? devPctRaw : undefined

    autoApi.appendData({
      drugStoreId,
      drugIds,
      regionIds: regionIds.length > 0 ? regionIds : undefined,
      distributorIds: s.supplierIds.length > 0 ? s.supplierIds.map((x) => Number(x)) : undefined,
      producerNames: s.manufacturerNames.length > 0 ? s.manufacturerNames : undefined,
      priceDeviationPct: devPct,
      priceAgeDays: s.priceAgeDays ?? undefined, // null → бэк применит «за всё время»
    }, undefined, (apiResult: AutoSelectItem[]) => {
      setResults(buildAutoSelectResults(apiResult, medicineByDrugId, mockMedicines))
      setStep('results')
    })
  }

  const matched  = results.filter((r) => r.reason === 'ok' && r.offer)
  const noOffers = results.filter((r) => r.reason === 'no_offers')
  const filtered = results.filter((r) => r.reason === 'filtered_out')

  // ── Confirm: bulk add ──
  function handleConfirm() {
    if (!drugStoreId || matched.length === 0) return
    setStep('adding')
    setAddError(null)

    const items: AddCartItemPayload[] = matched
      .filter((r) => r.offer)
      .map((r) => ({
        drugStoreId,
        drugId: r.offer!.drugId,
        distributorId: r.offer!.distributorId,
        itemId: r.offer!.itemId,
        priceId: r.offer!.priceId,
        price: r.offer!.price,
        producerId: r.offer!.producerId,
        quantity: 1,
      }))

    bulkApi.appendData({ items }, undefined, (resp: BulkAddCartResult) => {
      const added = resp?.added?.length ?? 0
      const failed = resp?.failed?.length ?? 0
      onAdded?.(added, failed)
      if (failed > 0 && added === 0) {
        setAddError(t('autoselect_add_failed', { defaultValue: 'Не удалось добавить в корзину' }))
        setStep('results')
        return
      }
      onClose()
    })
  }

  // ── Рендер ──
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={step === 'adding' ? undefined : onClose} />

      <div className="relative z-10 flex h-full max-h-[100vh] w-full flex-col overflow-hidden bg-white shadow-xl md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-xl md:border md:border-gray-200 dark:bg-[#111111] dark:md:border-gray-700">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('autoselect_title')}</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {medicines.length} {medicines.length === 1 ? t('autoselect_med_one') : t('autoselect_med_many')} · {t('autoselect_hint')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('modal_close')}
            disabled={step === 'adding'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'settings' && (
            <SettingsStep
              s={s}
              setS={setS}
              distQuery={distState.query}
              setDistQuery={distState.setQuery}
              distItems={distState.items}
              distHasNext={distState.hasNext}
              distLoading={distState.isLoading}
              distLoadMore={distState.onLoadMore}
              distLabels={distLabels}
              manufacturerOptions={manufacturerOptions}
            />
          )}
          {step === 'loading' && <LoadingStep />}
          {step === 'adding' && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-[#f1f1f1]" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('autoselect_adding', { count: matched.length, defaultValue: `Добавляем ${matched.length}...` })}
              </p>
            </div>
          )}
          {step === 'results' && (
            <>
              {addError && (
                <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                  {addError}
                </div>
              )}
              <ResultsStep
                totalCount={medicines.length}
                matched={matched}
                noOffers={noOffers}
                filtered={filtered}
              />
            </>
          )}
        </div>

        {(step === 'settings' || step === 'results') && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
            {step === 'settings' ? (
              <>
                <Button variant="outline" onClick={onClose}>{t('confirm_cancel')}</Button>
                <Button onClick={handleRun} disabled={!drugStoreId || autoApi.isLoading}>
                  {t('autoselect_run')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setStep('settings'); setAddError(null) }}>
                  {t('autoselect_back')}
                </Button>
                <Button disabled={matched.length === 0} onClick={handleConfirm}>
                  {t('autoselect_add_to_cart', { count: matched.length })}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export type { AutoSelectOffer }
