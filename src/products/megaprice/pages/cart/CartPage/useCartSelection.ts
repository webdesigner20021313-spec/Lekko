import { useCallback, useEffect, useState } from 'react'
import type { CartItem } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { DistGroup } from './types'

/**
 * Выбор позиций корзины: чекбоксы (checkedIds) + свёрнутые группы (collapsed) +
 * тогглеры. Авто-выбор всех позиций при первой загрузке/добавлении — иначе кнопка
 * «Завершить заказ» не появляется (она зависит от checkedIds). Вынесено из CartPage.
 *
 * @param items         все позиции корзины (для авто-выбора)
 * @param filteredItems видимые позиции (для toggleAll / allChecked)
 */
export function useCartSelection(items: CartItem[], filteredItems: CartItem[]) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [collapsed,  setCollapsed]  = useState<Set<string>>(new Set())

  // Авто-выбор всех позиций при первой загрузке + при добавлении новых в корзину.
  useEffect(() => {
    if (items.length === 0) return
    // Намеренный setState-в-effect: авто-выбор вновь появившихся позиций
    // (накопительно, не выводится из props/state на рендере).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckedIds(prev => {
      let changed = false
      const next = new Set(prev)
      items.forEach(it => {
        if (!next.has(it.offerId)) { next.add(it.offerId); changed = true }
      })
      return changed ? next : prev
    })
  }, [items])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleItem = useCallback((offerId: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(offerId)) next.delete(offerId)
      else next.add(offerId)
      return next
    })
  }, [])

  const toggleGroup = useCallback((group: DistGroup) => {
    const allIn = group.items.every(i => checkedIds.has(i.offerId))
    setCheckedIds(prev => {
      const next = new Set(prev)
      group.items.forEach(i => allIn ? next.delete(i.offerId) : next.add(i.offerId))
      return next
    })
  }, [checkedIds])

  const toggleAll = useCallback(() => {
    const allVisible = filteredItems.every(i => checkedIds.has(i.offerId))
    setCheckedIds(prev => {
      const next = new Set(prev)
      filteredItems.forEach(i => allVisible ? next.delete(i.offerId) : next.add(i.offerId))
      return next
    })
  }, [filteredItems, checkedIds])

  const allChecked  = filteredItems.length > 0 && filteredItems.every(i => checkedIds.has(i.offerId))
  const someChecked = !allChecked && filteredItems.some(i => checkedIds.has(i.offerId))

  return {
    checkedIds,
    setCheckedIds,
    collapsed,
    toggleCollapse,
    toggleItem,
    toggleGroup,
    toggleAll,
    allChecked,
    someChecked,
  }
}
