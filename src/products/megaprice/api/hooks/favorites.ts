/**
 * Favorite drugs — избранные препараты аптеки.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

export function useFavoriteDrugIds() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<number[]>({
    request: {
      url: '/api/drugsearch/favorites/drugs',
      method: 'GET',
      params: { drugStoreId },
    },
    enabled: !!drugStoreId,
  })
}

export function useAddFavoriteDrug(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/drugsearch/favorites/drugs', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

export function useRemoveFavoriteDrug(onSuccess?: () => void) {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient({
    request: {
      url: '/api/drugsearch/favorites/drugs/:id',
      method: 'DELETE',
      params: { drugStoreId },
      disableOnMount: true,
    },
    onSuccess: () => onSuccess?.(),
  })
}
