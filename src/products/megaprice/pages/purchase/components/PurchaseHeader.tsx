import { ShoppingCart, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/utils/utils'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import { mp } from '@/products/megaprice/utils/path'
import type { PurchaseTab } from '../PurchasePage'

interface PurchaseHeaderProps {
  activeTab: PurchaseTab
  onTabChange: (tab: PurchaseTab) => void
showFavorites: boolean
  onFavoritesToggle: () => void
}

const tabs: { key: PurchaseTab; label: string }[] = [
  { key: 'manual',      label: 'Вручную'  },
  { key: 'post',        label: 'Pos'      },
  { key: 'excel',       label: 'Excel'    },
  { key: 'wholesalers', label: 'Дистрибуторы' },
]

export function PurchaseHeader({
  activeTab,
  onTabChange,
showFavorites,
  onFavoritesToggle,
}: PurchaseHeaderProps) {
  const totalItems = usePurchaseCart((s) => s.totalItems)
  const navigate = useNavigate()

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      {/* Единые табы */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Favorites toggle */}
        <button
          onClick={onFavoritesToggle}
          title={showFavorites ? 'Скрыть избранное' : 'Показать избранное'}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
            showFavorites
              ? 'border-amber-400 bg-amber-50 text-amber-500'
              : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          )}
        >
          <Heart className={cn('h-4 w-4', showFavorites && 'fill-amber-500')} />
        </button>

        {/* Cart */}
        <button onClick={() => navigate(mp('/cart'))} className="flex h-10 items-center gap-1.5 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-black">
          <ShoppingCart className="h-4 w-4" />
          Корзина
          {totalItems() > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-gray-900">
              {totalItems()}
            </span>
          )}
        </button>

      </div>
    </div>
  )
}
