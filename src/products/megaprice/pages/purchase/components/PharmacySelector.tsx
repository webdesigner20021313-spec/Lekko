import { Building2 } from 'lucide-react'
import { mockPharmacies } from '@/products/megaprice/mocks/purchase.mocks'
import type { Pharmacy } from '@/products/megaprice/pages/purchase/types/purchase.types'

interface PharmacySelectorProps {
  selected: Pharmacy | null
  onChange: (pharmacy: Pharmacy) => void
}

export function PharmacySelector({ selected, onChange }: PharmacySelectorProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const pharmacy = mockPharmacies.find((p) => p.id === e.target.value)
    if (pharmacy) onChange(pharmacy)
  }

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <select
          value={selected?.id ?? ''}
          onChange={handleChange}
          className="flex-1 appearance-none bg-transparent text-sm font-medium text-gray-900 outline-none cursor-pointer dark:text-gray-100"
        >
          <option value="" disabled>
            Выберите аптеку
          </option>
          {mockPharmacies.map((pharmacy) => (
            <option key={pharmacy.id} value={pharmacy.id}>
              {pharmacy.name} — {pharmacy.city}, {pharmacy.address}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <p className="mt-1 pl-6 text-xs text-gray-500">
          {selected.city}, {selected.address}
        </p>
      )}
    </div>
  )
}
