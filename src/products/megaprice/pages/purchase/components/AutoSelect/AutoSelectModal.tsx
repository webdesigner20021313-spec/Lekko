import { useState, useMemo } from 'react'
import { X, Search, CheckCircle2, AlertTriangle, Loader2, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { formatCurrency } from '@/shared/utils/format'
import { Button } from '@/shared/ui-kit/Button'
import type { Medicine, SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutoSelectResult {
  medicine: Medicine
  offer: SupplierOffer | null
}

interface AutoSelectModalProps {
  medicines: Medicine[]
  offers: SupplierOffer[]
  onClose: () => void
  onConfirm: (results: AutoSelectResult[]) => void
}

interface LocalResult {
  medicine: Medicine
  offer: SupplierOffer | null
  reason: 'ok' | 'no_offers' | 'filtered_out'
}

// Пустой массив = нет ограничений
// Иерархия алгоритма: город → дистрибутор → производитель → цена
interface Settings {
  cityFilter:        string[]
  supplierIds:       string[]
  manufacturerNames: string[]
  priceDeviationPct: string
}

// Все города Узбекистана (для пилюль фильтра)
const UZ_CITIES = [
  'Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Андижан',
  'Фергана', 'Нукус', 'Карши', 'Термез', 'Ургенч',
  'Навои', 'Джизак', 'Гулистон', 'Коканд',
]

const DIST_META: Record<string, { region: string; isPrevious: boolean }> = {
  'd1':  { region: 'Ташкент',   isPrevious: true  },
  'd2':  { region: 'Самарканд', isPrevious: true  },
  'd3':  { region: 'Ташкент',   isPrevious: false },
  'd4':  { region: 'Ташкент',   isPrevious: true  },
  'd5':  { region: 'Бухара',    isPrevious: false },
  'd6':  { region: 'Андижан',   isPrevious: false },
  'd7':  { region: 'Самарканд', isPrevious: false },
  'd8':  { region: 'Навои',     isPrevious: true  },
  'd9':  { region: 'Наманган',  isPrevious: false },
  'd10': { region: 'Ташкент',   isPrevious: true  },
  'd11': { region: 'Фергана',   isPrevious: false },
  'd12': { region: 'Фергана',   isPrevious: false },
  'd13': { region: 'Самарканд', isPrevious: false },
  'd14': { region: 'Карши',     isPrevious: true  },
  'd15': { region: 'Ташкент',   isPrevious: true  },
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = [
  'h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800',
  'placeholder:text-gray-400 transition-colors duration-150',
  'hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10',
  'dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500 dark:hover:border-gray-600 dark:focus:border-gray-500',
].join(' ')

function Label({
  children,
  onClear,
  hasValue,
}: {
  children: React.ReactNode
  onClear?: () => void
  hasValue?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{children}</p>
      {onClear !== undefined && (
        <button
          type="button"
          onClick={onClear}
          disabled={!hasValue}
          className={cn(
            'text-[12px] font-medium transition-colors',
            hasValue
              ? 'cursor-pointer text-red-500 hover:text-red-700'
              : 'cursor-default text-gray-300',
          )}
        >
          {t('filter_clear')}
        </button>
      )}
    </div>
  )
}

// ─── TagInput ─────────────────────────────────────────────────────────────────

interface TagOption { id: string; label: string; sublabel?: string }

function TagInput({
  options, selected, onAdd, onRemove, placeholder,
}: {
  options: TagOption[]
  selected: string[]
  onAdd: (id: string) => void
  onRemove: (id: string) => void
  placeholder?: string
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => options.filter(o =>
    !selected.includes(o.id) &&
    (!query ||
      o.label.toLowerCase().includes(query.toLowerCase()) ||
      (o.sublabel ?? '').toLowerCase().includes(query.toLowerCase()))
  ), [options, selected, query])

  const selectedOptions = useMemo(
    () => selected.map(id => options.find(o => o.id === id)).filter(Boolean) as TagOption[],
    [options, selected]
  )

  return (
    <div>
      {/* Поле поиска */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          className={cn(inputCls, 'pl-8')}
        />
      </div>

      {/* Выпадающий список */}
      {open && (
        <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-[#111111]">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-sm text-gray-400">
              {query
                ? t('filter_nothing_found')
                : selected.length === options.length
                  ? t('autoselect_all_selected')
                  : t('autoselect_start_typing')}
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto">
              {filtered.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); onAdd(opt.id); setQuery('') }}
                  className="group flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="shrink-0 text-xs text-gray-400 dark:text-[#929292]">{opt.sublabel}</span>
                  )}
                  <Check className="h-4 w-4 shrink-0 text-gray-900 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Теги выбранных */}
      {selectedOptions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {selectedOptions.map(opt => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[13px] font-medium text-gray-700 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200"
            >
              {opt.label}
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => onRemove(opt.id)}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AutoSelectModal ──────────────────────────────────────────────────────────

export function AutoSelectModal({ medicines, offers, onClose, onConfirm }: AutoSelectModalProps) {
  const { t } = useTranslation()

  // ── Производные данные ───────────────────────────────────────────────────────

  const allSuppliers = useMemo(() => {
    const seen = new Set<string>()
    const result: Array<{ id: string; name: string; city: string }> = []
    for (const o of offers) {
      if (!seen.has(o.distributor.id)) {
        seen.add(o.distributor.id)
        result.push(o.distributor)
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [offers])

  const allCities = UZ_CITIES

  const allManufacturers = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of medicines) map.set(m.manufacturer, m.country)
    return Array.from(map.entries())
      .map(([name, country]) => ({ name, country }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [medicines])

  const supplierOptions = useMemo<TagOption[]>(() => allSuppliers.map(x => ({
    id: x.id,
    label: x.name,
    sublabel: DIST_META[x.id]?.region ?? x.city,
  })), [allSuppliers])

  const manufacturerOptions = useMemo<TagOption[]>(() => allManufacturers.map(m => ({
    id: m.name,
    label: m.name,
    sublabel: m.country,
  })), [allManufacturers])

  // ── Состояние ───────────────────────────────────────────────────────────────

  const [step, setStep] = useState<'settings' | 'loading' | 'results'>('settings')
  const [results, setResults] = useState<LocalResult[]>([])

  const [s, setS] = useState<Settings>({
    cityFilter:        [],
    supplierIds:       [],
    manufacturerNames: [],
    priceDeviationPct: '',
  })

  // ── Обработчики ─────────────────────────────────────────────────────────────

  function toggleCity(city: string) {
    setS(p => ({
      ...p,
      cityFilter: p.cityFilter.includes(city)
        ? p.cityFilter.filter(c => c !== city)
        : [...p.cityFilter, city],
    }))
  }

  function addSupplier(id: string) {
    setS(p => ({ ...p, supplierIds: p.supplierIds.includes(id) ? p.supplierIds : [...p.supplierIds, id] }))
  }
  function removeSupplier(id: string) {
    setS(p => ({ ...p, supplierIds: p.supplierIds.filter(x => x !== id) }))
  }

  function addManu(name: string) {
    setS(p => ({ ...p, manufacturerNames: p.manufacturerNames.includes(name) ? p.manufacturerNames : [...p.manufacturerNames, name] }))
  }
  function removeManu(name: string) {
    setS(p => ({ ...p, manufacturerNames: p.manufacturerNames.filter(x => x !== name) }))
  }

  // ── Алгоритм: город → дистрибутор → производитель → цена ─────────────────────────

  function handleRun() {
    setStep('loading')
    setTimeout(() => {
      const devPct      = s.priceDeviationPct ? parseFloat(s.priceDeviationPct) : null
      const cityLimited = s.cityFilter.length > 0
      const suppLimited = s.supplierIds.length > 0
      const manuLimited = s.manufacturerNames.length > 0

      const computed: LocalResult[] = medicines.map(medicine => {
        if (manuLimited && !s.manufacturerNames.includes(medicine.manufacturer)) {
          return { medicine, offer: null, reason: 'filtered_out' }
        }

        const allMed = offers.filter(o => o.medicineId === medicine.id)
        if (!allMed.length) return { medicine, offer: null, reason: 'no_offers' }

        const avgPrice = allMed.reduce((sum, o) => sum + o.priceWithVat, 0) / allMed.length

        const candidates = allMed.filter(o => {
          if (cityLimited) {
            const region = DIST_META[o.distributor.id]?.region ?? o.distributor.city
            if (!s.cityFilter.includes(region)) return false
          }
          if (suppLimited && !s.supplierIds.includes(o.distributor.id)) return false
          if (devPct !== null && o.priceWithVat > avgPrice * (1 + devPct / 100)) return false
          return true
        })

        if (!candidates.length) return { medicine, offer: null, reason: 'filtered_out' }
        const best = [...candidates].sort((a, b) => a.priceWithVat - b.priceWithVat)[0]
        return { medicine, offer: best, reason: 'ok' }
      })

      setResults(computed)
      setStep('results')
    }, 900)
  }

  const matched  = results.filter(r => r.reason === 'ok')
  const noOffers = results.filter(r => r.reason === 'no_offers')
  const filtered = results.filter(r => r.reason === 'filtered_out')

  // ── Рендер ───────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#111111]"
        style={{ maxHeight: '90vh' }}
      >

        {/* ── Шапка ──────────────────────────────────────────────────────────── */}
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Тело ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ━━━ НАСТРОЙКИ ━━━ */}
          {step === 'settings' && (
            <>
              {/* Город */}
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <Label
                  onClear={() => setS(p => ({ ...p, cityFilter: [] }))}
                  hasValue={s.cityFilter.length > 0}
                >
                  {t('filter_city')}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {allCities.map(city => {
                    const active = s.cityFilter.includes(city)
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(city)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-[13px] font-medium transition-colors duration-150',
                          active
                            ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700',
                        )}
                      >
                        {city}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Дистрибутор */}
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <Label
                  onClear={() => setS(p => ({ ...p, supplierIds: [] }))}
                  hasValue={s.supplierIds.length > 0}
                >
                  {t('filter_distributor')}
                </Label>
                <TagInput
                  options={supplierOptions}
                  selected={s.supplierIds}
                  onAdd={addSupplier}
                  onRemove={removeSupplier}
                  placeholder={t('autoselect_find_distributor')}
                />
              </div>

              {/* Производитель */}
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <Label
                  onClear={() => setS(p => ({ ...p, manufacturerNames: [] }))}
                  hasValue={s.manufacturerNames.length > 0}
                >
                  {t('filter_manufacturer')}
                </Label>
                <TagInput
                  options={manufacturerOptions}
                  selected={s.manufacturerNames}
                  onAdd={addManu}
                  onRemove={removeManu}
                  placeholder={t('autoselect_find_manufacturer')}
                />
              </div>

              {/* Цена */}
              <div className="px-5 py-4">
                <Label
                  onClear={() => setS(p => ({ ...p, priceDeviationPct: '' }))}
                  hasValue={s.priceDeviationPct !== ''}
                >
                  {t('autoselect_max_deviation')}
                </Label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={s.priceDeviationPct}
                    onChange={e => setS(p => ({ ...p, priceDeviationPct: e.target.value }))}
                    placeholder={t('autoselect_no_limit')}
                    className={cn(inputCls, 'pr-8')}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
            </>
          )}

          {/* ━━━ ЗАГРУЗКА ━━━ */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">{t('autoselect_loading')}</p>
                <p className="mt-1 text-xs text-gray-400">{t('autoselect_loading_sub')}</p>
              </div>
            </div>
          )}

          {/* ━━━ РЕЗУЛЬТАТЫ ━━━ */}
          {step === 'results' && (
            <div className="p-5">

              {/* Сводка */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center dark:border-gray-700 dark:bg-[#222222]">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{medicines.length}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">{t('autoselect_stat_total')}</p>
                </div>
                <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-[#065F46]">{matched.length}</p>
                  <p className="mt-0.5 text-xs text-[#065F46]/80">{t('autoselect_stat_matched')}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-700 dark:bg-[#222222]">
                  <p className={cn(
                    'text-2xl font-bold',
                    (noOffers.length + filtered.length) > 0 ? 'text-gray-700' : 'text-gray-300',
                  )}>
                    {noOffers.length + filtered.length}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{t('autoselect_stat_excluded')}</p>
                </div>
              </div>

              {/* Подобранные */}
              {matched.length > 0 && (
                <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('autoselect_section_matched', { count: matched.length })}</p>
                  </div>
                  <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto bg-white dark:divide-[#333333] dark:bg-[#111111]">
                    {matched.map(r => (
                      <div key={r.medicine.id} className="flex h-[52px] items-center gap-3 px-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{r.medicine.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#929292]">
                            {r.offer!.distributor.name} · {r.offer!.distributor.city}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(r.offer!.priceWithVat)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matched.length === 0 && (
                <div className="mb-3 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-[#222222]">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('autoselect_no_results')}</p>
                  <p className="mt-1 text-xs text-gray-400">{t('autoselect_no_results_hint')}</p>
                </div>
              )}

              {/* Нет предложений */}
              {noOffers.length > 0 && (
                <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('autoselect_section_no_offers', { count: noOffers.length })}</p>
                  </div>
                  <div className="max-h-28 divide-y divide-gray-100 overflow-y-auto bg-white dark:divide-[#333333] dark:bg-[#111111]">
                    {noOffers.map(r => (
                      <p key={r.medicine.id} className="flex h-9 items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                        {r.medicine.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Исключено */}
              {filtered.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-[#222222]">
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('autoselect_section_excluded', { count: filtered.length })}</p>
                  </div>
                  <div className="max-h-28 divide-y divide-gray-100 overflow-y-auto bg-white dark:divide-[#333333] dark:bg-[#111111]">
                    {filtered.map(r => (
                      <p key={r.medicine.id} className="flex h-9 items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                        {r.medicine.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── Футер ──────────────────────────────────────────────────────────── */}
        {step !== 'loading' && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
            {step === 'settings' ? (
              <>
                <Button variant="outline" onClick={onClose}>{t('confirm_cancel')}</Button>
                <Button onClick={handleRun}>{t('autoselect_run')}</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep('settings')}>{t('autoselect_back')}</Button>
                <Button
                  disabled={matched.length === 0}
                  onClick={() => {
                    onConfirm(matched.map(r => ({ medicine: r.medicine, offer: r.offer })))
                    onClose()
                  }}
                >
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
