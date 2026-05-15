import { useState, useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import { PurchaseHeader } from '../components/PurchaseHeader'
import { MedicineList } from '../components/MedicineList/MedicineList'
import { SupplierOffers } from '../components/SupplierOffers/SupplierOffers'
import { AutoSelectModal } from '../components/AutoSelect/AutoSelectModal'
import { WholesalersView } from '../components/WholesalersView'
import { DistributorProducts } from '../components/DistributorProducts'
import { mockSupplierOffers, mockMedicines } from '@/products/megaprice/mocks/purchase.mocks'
import { usePurchaseCart } from '../hooks/usePurchaseCart'
import type { Medicine, SupplierOffer, Distributor } from '../types/purchase.types'

export type PurchaseTab = 'manual' | 'post' | 'excel' | 'wholesalers'

export function PurchasePage() {
  const [activeTab, setActiveTab] = useState<PurchaseTab>('manual')
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [showAutoSelect, setShowAutoSelect] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [splitPct,    setSplitPct]    = useState(36)
  const [wSplitPct,   setWSplitPct]   = useState(25)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

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

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">
      <PurchaseHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showFavorites={showFavorites}
        onFavoritesToggle={() => setShowFavorites((v) => !v)}
      />

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
              />
            : <MedicineList
                activeTab={activeTab}
                selectedMedicine={selectedMedicine}
                onSelect={handleSelectMedicine}
                checkedIds={checkedIds}
                onToggleCheck={handleToggleCheck}
                showFavorites={showFavorites}
                onAutoSelect={() => setShowAutoSelect(true)}
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
          {/* Mobile back button */}
          <button
            onClick={handleMobileBack}
            className="flex items-center gap-1.5 border-b border-gray-200 px-4 py-3 text-sm font-medium text-[#3872FA] dark:border-gray-700 md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </button>
          {activeTab === 'wholesalers'
            ? <DistributorProducts distributor={selectedDistributor} />
            : <SupplierOffers medicine={selectedMedicine} />
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
