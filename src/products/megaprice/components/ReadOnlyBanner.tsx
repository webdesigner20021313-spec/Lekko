import { Eye } from 'lucide-react'
import { useIsReadOnly } from '@/products/megaprice/hooks/useIsReadOnly'

/**
 * Баннер режима просмотра для дистрибьютора на megaprice.
 * Рендерится в layout'ах над контентом; сам решает показываться или нет.
 */
export function ReadOnlyBanner() {
  const readOnly = useIsReadOnly()
  if (!readOnly) return null
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
      <Eye className="h-4 w-4 shrink-0" />
      <span>Режим просмотра: вы вошли как дистрибьютор. Покупка и оформление заказов недоступны.</span>
    </div>
  )
}
