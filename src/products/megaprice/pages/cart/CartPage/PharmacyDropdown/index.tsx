import { useEffect, useRef } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { mockPharmacies } from '@/products/megaprice/mocks/purchase.mocks'
import type { Pharmacy } from '@/products/megaprice/pages/purchase/types/purchase.types'

/**
 * Desktop-вариант: фиксированная высота шапки 48px, открывается «вниз», с outside-click close.
 * Внутри `BottomSheet` (mobile) inline-стиль чуть отличается — для него передаём `inline`.
 */
export function PharmacyDropdown({
  pharmacy,
  pharmacyId,
  show,
  setShow,
  onSelect,
  inline = false,
}: {
  pharmacy: Pharmacy
  pharmacyId: string
  show: boolean
  setShow: (next: boolean | ((p: boolean) => boolean)) => void
  onSelect: (id: string) => void
  inline?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inline) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [inline, setShow])

  if (inline) {
    return (
      <>
        <button
          onClick={() => setShow(v => !v)}
          className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 px-3 dark:border-gray-700"
        >
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-gray-500 dark:text-[#929292]" />
            <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{pharmacy.name}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', show && 'rotate-180')} />
        </button>
        {show && (
          <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            {mockPharmacies.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p.id); setShow(false) }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-3 text-left text-sm border-b last:border-0 border-gray-100 dark:border-[#333333]',
                  p.id === pharmacyId ? 'bg-gray-50 font-semibold text-gray-900 dark:bg-[#222222] dark:text-gray-100' : 'text-gray-600 dark:text-gray-400',
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setShow(v => !v)}
        className="flex h-12 w-full items-center justify-between border-b border-gray-200 px-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 shrink-0 text-gray-500 dark:text-[#929292]" />
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{pharmacy.name}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150', show && 'rotate-180')} />
      </button>

      {show && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-[#111111]">
          {mockPharmacies.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); setShow(false) }}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                p.id === pharmacyId ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
