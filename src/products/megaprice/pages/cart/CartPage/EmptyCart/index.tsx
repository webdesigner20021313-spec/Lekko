import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui-kit/Button'
import { mp } from '@/products/megaprice/utils/path'

export function EmptyCart() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 dark:bg-[#222222]">
        <ShoppingCart className="h-9 w-9 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{t('cart_empty_title')}</p>
      <p className="mt-1.5 text-sm text-gray-400 dark:text-[#929292]">{t('cart_empty_hint')}</p>
      <Link to={mp('/purchase')} className="mt-6">
        <Button size="sm" variant="outline">{t('cart_go_purchase')}</Button>
      </Link>
    </div>
  )
}
