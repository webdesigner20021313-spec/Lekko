import { useState, useMemo, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { Package } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/ui-kit/Toaster'
import { type NeedItem, type NeedStatus } from '@/products/megaprice/mocks/need.mocks'
import type { SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import { PHARMACIES, SCENARIOS } from './config'
import {
  calcKpi,
  calcRecommendedQty,
  defaultSort,
  getBestOffer,
  getMultiPharmacyItems,
} from './helpers'
import type { PeriodKey, ScenarioKey } from './types'
import { AIAdviceModal } from './AIAdviceModal'
import { BulkActionsBar } from './BulkActionsBar'
import { FiltersBar } from './FiltersBar'
import { KpiCards } from './KpiCards'
import { MobileFiltersSheet } from './MobileFiltersSheet'
import { MobileTopBar } from './MobileTopBar'
import { NeedDrawer } from './NeedDrawer'
import { NeedItemCardMobile } from './NeedItemCardMobile'
import { NeedTable } from './NeedTable'
import { OffersModal } from './OffersModal'

export function NeedPage() {
  const { t } = useTranslation()
  const { addItem } = usePurchaseCart()
  const { toast } = useToast()

  const [selectedPharmacyIds, setSelectedPharmacyIds] = useState<string[]>([])
  const [pharmacyOpen, setPharmacyOpen]               = useState(false)

  const [scenario] = useState<ScenarioKey>('all')
  const [period,       setPeriod]      = useState<PeriodKey>('30d')
  const [periodOpen,   setPeriodOpen]  = useState(false)
  const [customFrom,   setCustomFrom]  = useState('')
  const [customTo,     setCustomTo]    = useState('')
  const [search,       setSearch]      = useState('')
  const [minSales]    = useState('')
  const [groupFilter,  setGroupFilter] = useState<string | null>(null)
  const [groupOpen,    setGroupOpen]   = useState(false)
  const [statusFilter, setStatusFilter] = useState<NeedStatus[]>([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [checkedIds,      setCheckedIds]      = useState<string[]>([])
  const [drawerItem,      setDrawerItem]      = useState<NeedItem | null>(null)
  const [offersModalItem, setOffersModalItem] = useState<NeedItem | null>(null)
  const [aiItem,          setAiItem]          = useState<NeedItem | null>(null)
  const [selectedOfferMap, setSelectedOfferMap] = useState<Record<string, SupplierOffer>>({})

  const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
    { key: '7d',     label: t('need_period_7d'),     days: 7   },
    { key: '30d',    label: t('need_period_30d'),    days: 30  },
    { key: '90d',    label: t('need_period_90d'),    days: 90  },
    { key: '1y',     label: t('need_period_1y'),     days: 365 },
    { key: 'custom', label: t('need_period_custom'), days: 30  },
  ]

  const periodDays = period === 'custom'
    ? (customFrom && customTo
        ? Math.max(1, Math.round((new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86_400_000))
        : 30)
    : PERIODS.find(p => p.key === period)!.days

  const pharmacyFiltered = useMemo(
    () => getMultiPharmacyItems(selectedPharmacyIds),
    [selectedPharmacyIds],
  )

  const kpi = useMemo(() => calcKpi(pharmacyFiltered, periodDays), [pharmacyFiltered, periodDays])

  const filtered = useMemo(() => {
    let list = SCENARIOS.find(s => s.key === scenario)!.filter(pharmacyFiltered)
    if (groupFilter) list = list.filter(i => i.group === groupFilter)
    if (statusFilter.length > 0) list = list.filter(i => statusFilter.includes(i.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.manufacturer.toLowerCase().includes(q))
    }
    const minVal = parseFloat(minSales)
    if (!isNaN(minVal) && minVal > 0) list = list.filter(i => i.avgDailySales >= minVal)
    return [...list].sort(defaultSort)
  }, [scenario, pharmacyFiltered, groupFilter, search, minSales, statusFilter])

  const allChecked  = filtered.length > 0 && filtered.every(i => checkedIds.includes(i.id))
  const someChecked = !allChecked && filtered.some(i => checkedIds.includes(i.id))

  const pharmacyLabel = selectedPharmacyIds.length === 0
    ? t('need_all_pharmacies', { n: PHARMACIES.length })
    : selectedPharmacyIds.length === 1
      ? (PHARMACIES.find(ph => ph.id === selectedPharmacyIds[0])?.name ?? t('need_ph_col_pharmacy'))
      : t('need_pharmacies_count', { n: selectedPharmacyIds.length })

  function handleKpiClick(statuses: NeedStatus[]) {
    const isActive = statuses.length === statusFilter.length && statuses.every(s => statusFilter.includes(s))
    setStatusFilter(isActive ? [] : statuses)
  }

  const handleSelectAll = useCallback(() => {
    if (allChecked) setCheckedIds(p => p.filter(id => !filtered.some(i => i.id === id)))
    else setCheckedIds(p => Array.from(new Set([...p, ...filtered.map(i => i.id)])))
  }, [allChecked, filtered])

  const toggleCheck = useCallback((id: string, e: MouseEvent) => {
    e.stopPropagation()
    setCheckedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }, [])

  const handleAddToCart = useCallback((item: NeedItem, qty: number, opts?: { silent?: boolean }) => {
    const offer = selectedOfferMap[item.id] ?? getBestOffer(item.id)
    if (!offer) return false
    addItem({
      offerId: offer.id, medicineId: item.id, quantity: qty, offer,
      medicine: { id: item.id, name: item.name, manufacturer: item.manufacturer, country: item.country, isFavorite: false, mnn: '', form: '', dosage: '', packageSize: '' } as any,
    })
    if (!opts?.silent) {
      toast({
        title: t('need_toast_added_title'),
        description: t('need_toast_added_desc', { name: item.name, n: qty }),
        variant: 'success',
      })
    }
    return true
  }, [addItem, selectedOfferMap, toast, t])

  function handleBulkAddToCart() {
    const selected = filtered.filter(i => checkedIds.includes(i.id))
    let added = 0
    selected.forEach(item => {
      const qty = calcRecommendedQty(item, periodDays)
      if (qty > 0 && handleAddToCart(item, qty, { silent: true })) added++
    })
    setCheckedIds([])
    if (added > 0) {
      const desc = added === 1
        ? t('need_toast_bulk_1', { n: added })
        : added < 5
          ? t('need_toast_bulk_few', { n: added })
          : t('need_toast_bulk_many', { n: added })
      toast({ title: t('need_toast_added_title'), description: desc, variant: 'success' })
    } else {
      toast({ title: t('need_toast_nothing_title'), description: t('need_toast_nothing_desc'), variant: 'warning' })
    }
  }

  function handleExport() {
    const rows = filtered.map(item => {
      const bestOffer = getBestOffer(item.id)
      return {
        [t('need_excel_name')]:       item.name,
        [t('need_excel_manufacturer')]: item.manufacturer,
        [t('need_excel_country')]:    item.country,
        [t('need_excel_group')]:      item.group,
        [t('need_excel_status')]:     t(`need_status_${item.status}`),
        [t('need_excel_stock')]:      item.stock,
        [t('need_excel_cover')]:      Math.round(item.daysOfCover),
        [t('need_excel_sales')]:      item.avgDailySales,
        [t('need_excel_need')]:       calcRecommendedQty(item, periodDays),
        [t('need_excel_price')]:      bestOffer?.priceWithVat ?? '',
        [t('need_excel_dist')]:       bestOffer?.distributor.name ?? '',
        [t('need_excel_dist_city')]:  bestOffer?.distributor.city ?? '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t('need_excel_sheet'))
    const pharmacyName = selectedPharmacyIds.length === 0
      ? t('need_excel_all_ph')
      : selectedPharmacyIds.length === 1
        ? (PHARMACIES.find(p => p.id === selectedPharmacyIds[0])?.name ?? t('need_excel_one_ph'))
        : t('need_excel_n_ph', { n: selectedPharmacyIds.length })
    XLSX.writeFile(wb, `${t('need_excel_sheet')} — ${pharmacyName} — ${new Date().toLocaleDateString('ru')}.xlsx`)
  }

  const hasFiltersActive = selectedPharmacyIds.length > 0 || !!groupFilter || period !== '30d'

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]"
      onClick={() => { setGroupOpen(false); setPharmacyOpen(false) }}>

      <MobileTopBar
        search={search}
        setSearch={setSearch}
        hasFilters={hasFiltersActive}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        onExport={handleExport}
      />

      <FiltersBar
        selectedPharmacyIds={selectedPharmacyIds}
        setSelectedPharmacyIds={setSelectedPharmacyIds}
        pharmacyOpen={pharmacyOpen}
        setPharmacyOpen={setPharmacyOpen}
        pharmacyLabel={pharmacyLabel}
        search={search}
        setSearch={setSearch}
        groupFilter={groupFilter}
        setGroupFilter={setGroupFilter}
        groupOpen={groupOpen}
        setGroupOpen={setGroupOpen}
        period={period}
        setPeriod={setPeriod}
        periodOpen={periodOpen}
        setPeriodOpen={setPeriodOpen}
        periods={PERIODS}
        customFrom={customFrom}
        customTo={customTo}
        setCustomFrom={setCustomFrom}
        setCustomTo={setCustomTo}
        onExport={handleExport}
      />

      <KpiCards
        kpi={kpi}
        periodDays={periodDays}
        statusFilter={statusFilter}
        onKpiClick={handleKpiClick}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Mobile cards */}
          <div className="md:hidden flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-3 rounded-2xl bg-gray-100 p-5 dark:bg-[#222222]">
                  <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-[#929292]">{t('need_empty_filtered')}</p>
              </div>
            ) : (
              <div className="space-y-2 px-3 py-3">
                {filtered.map(item => (
                  <NeedItemCardMobile
                    key={item.id}
                    item={item}
                    isChecked={checkedIds.includes(item.id)}
                    recQty={calcRecommendedQty(item, periodDays)}
                    onOpen={() => setDrawerItem(item)}
                    onToggle={toggleCheck}
                    onShowAI={() => setAiItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop table */}
          <NeedTable
            filtered={filtered}
            periodDays={periodDays}
            checkedIds={checkedIds}
            allChecked={allChecked}
            someChecked={someChecked}
            drawerItemId={drawerItem?.id ?? null}
            onRowClick={(item) => setDrawerItem(drawerItem?.id === item.id ? null : item)}
            onSelectAll={handleSelectAll}
            onToggleCheck={toggleCheck}
            onShowAI={setAiItem}
          />

          {checkedIds.length >= 1 && (
            <BulkActionsBar
              count={checkedIds.length}
              onCancel={() => setCheckedIds([])}
              onAddToCart={handleBulkAddToCart}
            />
          )}
        </div>

        {drawerItem && (
          <NeedDrawer
            item={drawerItem}
            periodDays={periodDays}
            selectedPharmacyIds={selectedPharmacyIds}
            activeOffer={selectedOfferMap[drawerItem.id] ?? getBestOffer(drawerItem.id)}
            onClose={() => setDrawerItem(null)}
            onAddToCart={handleAddToCart}
            onShowOffers={setOffersModalItem}
          />
        )}
      </div>

      {offersModalItem && (
        <OffersModal
          item={offersModalItem}
          currentOfferId={selectedOfferMap[offersModalItem.id]?.id ?? null}
          onSelectOffer={offer => setSelectedOfferMap(prev => ({ ...prev, [offersModalItem.id]: offer }))}
          onClose={() => setOffersModalItem(null)}
        />
      )}

      {aiItem && (
        <AIAdviceModal item={aiItem} onClose={() => setAiItem(null)} />
      )}

      <MobileFiltersSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        selectedPharmacyIds={selectedPharmacyIds}
        setSelectedPharmacyIds={setSelectedPharmacyIds}
        groupFilter={groupFilter}
        setGroupFilter={setGroupFilter}
        period={period}
        setPeriod={setPeriod}
        periods={PERIODS}
        setSearch={setSearch}
      />
    </div>
  )
}
