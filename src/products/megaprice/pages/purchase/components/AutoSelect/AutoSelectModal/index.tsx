import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui-kit/Button'
import type { Medicine, SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { DIST_META } from './config'
import { LoadingStep } from './LoadingStep'
import { ResultsStep } from './ResultsStep'
import { SettingsStep } from './SettingsStep'
import type { AutoSelectResult, LocalResult, Settings, TagOption } from './types'

export function AutoSelectModal({ medicines, offers, onClose, onConfirm }: {
  medicines: Medicine[]
  offers: SupplierOffer[]
  onClose: () => void
  onConfirm: (results: AutoSelectResult[]) => void
}) {
  const { t } = useTranslation()

  // ── Производные данные ──

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

  // ── Состояние ──

  const [step, setStep] = useState<'settings' | 'loading' | 'results'>('settings')
  const [results, setResults] = useState<LocalResult[]>([])

  const [s, setS] = useState<Settings>({
    cityFilter:        [],
    supplierIds:       [],
    manufacturerNames: [],
    priceDeviationPct: '',
  })

  // ── Алгоритм: город → дистрибутор → производитель → цена ──

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

  // ── Рендер ──

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 flex h-full max-h-[100vh] w-full flex-col overflow-hidden bg-white shadow-xl md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-xl md:border md:border-gray-200 dark:bg-[#111111] dark:md:border-gray-700"
      >

        {/* ── Шапка ── */}
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

        {/* ── Тело ── */}
        <div className="flex-1 overflow-y-auto">
          {step === 'settings' && (
            <SettingsStep
              s={s}
              setS={setS}
              supplierOptions={supplierOptions}
              manufacturerOptions={manufacturerOptions}
            />
          )}
          {step === 'loading' && <LoadingStep />}
          {step === 'results' && (
            <ResultsStep
              totalCount={medicines.length}
              matched={matched}
              noOffers={noOffers}
              filtered={filtered}
            />
          )}
        </div>

        {/* ── Футер ── */}
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
