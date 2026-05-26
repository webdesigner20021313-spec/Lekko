import { useState, useRef, useMemo, useCallback } from 'react'
import { ChevronLeft, Heart, SlidersHorizontal, MapPin } from 'lucide-react'
import { PurchaseHeader } from './components/PurchaseHeader'
import { MedicineList } from './components/MedicineList/MedicineList'
import { SupplierOffers } from './components/SupplierOffers/SupplierOffers'
import { AutoSelectModal } from './components/AutoSelect/AutoSelectModal'
import { WholesalersView } from './components/WholesalersView'
import { DistributorProducts } from './components/DistributorProducts'
import { useTranslation } from 'react-i18next'
import { useMobileHeaderActions, useMobileHeaderSearch, useMobileHeaderTitle, useMobileHeaderBack, type HeaderAction, type HeaderSearch } from '@/shared/stores/useMobileHeaderStore'
import { mockSupplierOffers, mockMedicines } from '@/products/megaprice/mocks/purchase.mocks'
import { usePurchaseCart } from './hooks/usePurchaseCart'
import type { Medicine, SupplierOffer, Distributor } from './types/purchase.types'

export type PurchaseTab = 'manual' | 'post' | 'excel' | 'wholesalers'

export function PurchasePage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<PurchaseTab>('manual')
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [showAutoSelect, setShowAutoSelect] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [splitPct,    setSplitPct]    = useState(36)
  const [wSplitPct,   setWSplitPct]   = useState(25)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileCityFilterOpen, setMobileCityFilterOpen] = useState(false)
  const [mobileSupplierFiltersOpen, setMobileSupplierFiltersOpen] = useState(false)
  const [wholesalerCityCount, setWholesalerCityCount] = useState(0)
  const [supplierFilterCount, setSupplierFilterCount] = useState(0)
  const [search, setSearch] = useState('')

  // Стабильные callback'и для onCountChange — иначе useEffect в дочерних компонентах перезапускается на каждый рендер
  const handleCityFilterCountChange = useCallback((n: number) => setWholesalerCityCount(n), [])
  const handleSupplierFilterCountChange = useCallback((n: number) => setSupplierFilterCount(n), [])

  const containerRef = useRef<HTMLDivElement>(null)

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

  function handleSelectMedicine(medicine: Medicine | null) {
    setSelectedMedicine(medicine)
    if (medicine && isMobile()) setMobileDetailOpen(true)
  }

  function handleSelectDistributor(distributor: Distributor | null) {
    setSelectedDistributor(distributor)
    if (distributor && isMobile()) setMobileDetailOpen(true)
  }

  function handleMobileBack() {
    setMobileDetailOpen(false)
  }

  const { addItem } = usePurchaseCart()

  const currentSplit    = activeTab === 'wholesalers' ? wSplitPct    : splitPct
  const setCurrentSplit = activeTab === 'wholesalers' ? setWSplitPct : setSplitPct

  function startSplitResize(e: React.MouseEvent) {
    e.preventDefault()
    if (!containerRef.current) return
    const containerLeft = containerRef.current.getBoundingClientRect().left
    const containerWidth = containerRef.current.offsetWidth
    function onMove(ev: MouseEvent) {
      const pct = ((ev.clientX - containerLeft) / containerWidth) * 100
      setCurrentSplit(Math.min(80, Math.max(20, pct)))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function handleToggleCheck(id: string) {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function handleAutoSelectConfirm(
    results: { medicine: Medicine; offer: SupplierOffer | null }[]
  ) {
    results.forEach(({ medicine, offer }) => {
      if (!offer) return
      addItem({ offerId: offer.id, medicineId: medicine.id, quantity: 1, offer, medicine })
    })
  }

  const checkedMedicines = mockMedicines.filter((m) => checkedIds.includes(m.id))

  // Мобильный глобальный Header.
  // - detail-view (открыт продукт): action «Фильтры» для SupplierOffers (с indicator при активных фильтрах).
  //   На wholesalers-detail (страница дистрибутора) actions не нужны.
  // - wholesalers (список): action «Город» (MapPin) с indicator.
  // - остальные табы (список): «Избранное» (Heart) + «Фильтры» (SlidersHorizontal).
  const mobileHeaderActions = useMemo<HeaderAction[] | null>(() => {
    if (mobileDetailOpen) {
      if (activeTab === 'wholesalers') return null
      return [
        {
          id: 'supplier-filters',
          icon: SlidersHorizontal,
          onClick: () => setMobileSupplierFiltersOpen(true),
          ariaLabel: 'Фильтры',
          variant: supplierFilterCount > 0 ? 'active' : 'default',
          indicator: supplierFilterCount > 0,
        },
      ]
    }
    if (activeTab === 'wholesalers') {
      return [
        {
          id: 'city',
          icon: MapPin,
          onClick: () => setMobileCityFilterOpen(true),
          ariaLabel: 'Город',
          variant: wholesalerCityCount > 0 ? 'active' : 'default',
          indicator: wholesalerCityCount > 0,
        },
      ]
    }
    return [
      {
        id: 'favorites',
        icon: Heart,
        onClick: () => setShowFavorites((v) => !v),
        ariaLabel: 'Избранное',
        variant: showFavorites ? 'active' : 'default',
      },
      {
        id: 'filters',
        icon: SlidersHorizontal,
        onClick: () => setMobileFiltersOpen(true),
        ariaLabel: 'Фильтры',
      },
    ]
  }, [activeTab, mobileDetailOpen, showFavorites, wholesalerCityCount, supplierFilterCount])
  useMobileHeaderActions(mobileHeaderActions)

  // В режиме detail-view (открыта правая панель) — заголовок = название продукта/дистрибутора,
  // back-кнопка закрывает панель (а не уходит на родительский маршрут).
  const detailTitle = mobileDetailOpen
    ? (activeTab === 'wholesalers' ? selectedDistributor?.name : selectedMedicine?.name) ?? null
    : null
  useMobileHeaderTitle(detailTitle)
  useMobileHeaderBack(mobileDetailOpen ? handleMobileBack : null)

  // Поиск в мобильном Header (лупа → раскрывается на всю ширину).
  // Работает на всех табах (manual / post / excel / wholesalers). Скрывается только при открытой detail-панели.
  const mobileHeaderSearch = useMemo<HeaderSearch | null>(() => {
    if (mobileDetailOpen) return null
    return {
      value: search,
      onChange: setSearch,
      placeholder: t('filter_search'),
    }
  }, [mobileDetailOpen, search, t])
  useMobileHeaderSearch(mobileHeaderSearch)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#090909]">
      {/* На мобиле в detail-view (открыта правая панель) скрываем табы+корзину — экран выглядит как самостоятельная страница */}
      <div className={mobileDetailOpen ? 'hidden md:block' : ''}>
        <PurchaseHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showFavorites={showFavorites}
          onFavoritesToggle={() => setShowFavorites((v) => !v)}
        />
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel — list view. Full-width on mobile, split % on desktop */}
        <div
          className={`flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700 ${mobileDetailOpen ? 'hidden md:flex' : 'flex'}`}
          style={{ width: window.innerWidth >= 768 ? `${currentSplit}%` : '100%', minWidth: window.innerWidth >= 768 ? 200 : undefined }}
        >
          {activeTab === 'wholesalers'
            ? <WholesalersView
                selectedId={selectedDistributor?.id ?? null}
                onSelect={handleSelectDistributor}
                search={search}
                onSearchChange={setSearch}
                mobileCitySheetOpen={mobileCityFilterOpen}
                onMobileCitySheetOpenChange={setMobileCityFilterOpen}
                onCityFilterCountChange={handleCityFilterCountChange}
              />
            : <MedicineList
                activeTab={activeTab}
                selectedMedicine={selectedMedicine}
                onSelect={handleSelectMedicine}
                checkedIds={checkedIds}
                onToggleCheck={handleToggleCheck}
                showFavorites={showFavorites}
                onAutoSelect={() => setShowAutoSelect(true)}
                mobileFiltersOpen={mobileFiltersOpen}
                onMobileFiltersOpenChange={setMobileFiltersOpen}
                search={search}
                onSearchChange={setSearch}
              />
          }
        </div>

        {/* Resize handle — desktop only */}
        <div
          onMouseDown={startSplitResize}
          className="hidden w-2 cursor-col-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-400 active:bg-blue-500 dark:bg-gray-700 md:flex"
        />

        {/* Right panel — detail view. Hidden on mobile until item selected */}
        <div className={`flex flex-1 flex-col overflow-hidden ${!mobileDetailOpen ? 'hidden md:flex' : 'flex'}`}>
          {/* Mobile back button — на мобиле теперь в глобальном Header через useMobileHeaderBack */}
          <button
            onClick={handleMobileBack}
            className="hidden items-center gap-1.5 border-b border-gray-200 px-4 py-3 text-sm font-medium text-[#3872FA] dark:border-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </button>
          {activeTab === 'wholesalers'
            ? <DistributorProducts distributor={selectedDistributor} />
            : <SupplierOffers
                medicine={selectedMedicine}
                mobileFiltersOpen={mobileSupplierFiltersOpen}
                onMobileFiltersOpenChange={setMobileSupplierFiltersOpen}
                onFilterCountChange={handleSupplierFilterCountChange}
              />
          }
        </div>
      </div>

      {showAutoSelect && (
        <AutoSelectModal
          medicines={checkedMedicines}
          offers={mockSupplierOffers}
          onClose={() => setShowAutoSelect(false)}
          onConfirm={handleAutoSelectConfirm}
        />
      )}
    </div>
  )
}
