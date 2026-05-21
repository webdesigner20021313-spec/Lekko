import {
  useAddFavoriteDrug,
  useFavoriteDrugIds,
  useRemoveFavoriteDrug,
} from '@/products/megaprice/api/hooks'
import { useAuthStore } from '@/shared/auth/useAuthStore'

/**
 * Избранные препараты — единый интерфейс для UI.
 * Внутри: GET список + POST/DELETE через единый useQueryApiClient.
 */
export function useFavorites() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)

  const list = useFavoriteDrugIds()
  const ids = Array.isArray(list.data) ? list.data : []
  const set = new Set(ids)

  const add = useAddFavoriteDrug(list.refetch)
  const remove = useRemoveFavoriteDrug(list.refetch)

  return {
    favoriteDrugIds: ids,
    isFavorite: (drugId: number | null | undefined) =>
      typeof drugId === 'number' && set.has(drugId),
    toggle: (drugId: number) => {
      if (!drugStoreId) return
      if (set.has(drugId)) {
        remove.appendData({}, { id: drugId })
      } else {
        add.appendData({ drugStoreId, drugId })
      }
    },
    isMutating: add.isLoading || remove.isLoading,
  }
}
