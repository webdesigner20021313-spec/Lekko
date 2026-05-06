import { useState, useRef } from 'react'
import { PurchaseHeader } from './components/PurchaseHeader'
import { MedicineList } from './components/MedicineList/MedicineList'
import { SupplierOffers } from './components/SupplierOffers/SupplierOffers'
import { AutoSelectModal } from './components/AutoSelect/AutoSelectModal'
import { WholesalersView } from './components/WholesalersView'
import { DistributorProducts } from './components/DistributorProducts'
import { mockSupplierOffers, mockMedicines } from '@/products/megaprice/mocks/purchase.mocks'
import { usePurchaseCart } from './hooks/usePurchaseCart'
import type { Medicine, SupplierOffer, Distributor } from './types/purchase.types'

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

  const containerRef = useRef<HTMLDivElement>(null)

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
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900">
      <PurchaseHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showFavorites={showFavorites}
        onFavoritesToggle={() => setShowFavorites((v) => !v)}
      />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel — меняется в зависимости от вкладки */}
        <div
          className="flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700"
          style={{ width: `${currentSplit}%`, minWidth: 200 }}
        >
          {activeTab === 'wholesalers'
            ? <WholesalersView
                selectedId={selectedDistributor?.id ?? null}
                onSelect={setSelectedDistributor}
              />
            : <MedicineList
                activeTab={activeTab}
                selectedMedicine={selectedMedicine}
                onSelect={setSelectedMedicine}
                checkedIds={checkedIds}
                onToggleCheck={handleToggleCheck}
                showFavorites={showFavorites}
                onAutoSelect={() => setShowAutoSelect(true)}
              />
          }
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={startSplitResize}
          className="flex w-2 cursor-col-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-400 active:bg-blue-500 dark:bg-gray-700"
        />

        {/* Right panel — меняется только в режиме оптовиков */}
        <div className="flex flex-1 flex-col overflow-hidden">
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
