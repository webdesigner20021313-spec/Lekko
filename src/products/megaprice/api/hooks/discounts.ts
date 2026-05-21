/**
 * Personal discounts — персональные скидки аптеки по дистрибьюторам.
 * Часть api-хуков Megaprice (см. ./index.ts).
 */
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'

export interface ApiPersonalDiscount {
  drugStoreId: number
  distributorId: number
  discountPercent: number
  inn?: string | null
  payDeferment?: number | null
  bonus?: number | null
  prepayPercent?: number | null
  blockDate?: string | null
  defermentPayBonus?: number | null
}

/** GET /api/drugsearch/personal-discounts?drugStoreId=N */
export function usePersonalDiscounts() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  return useQueryApiClient<ApiPersonalDiscount[]>({
    request: {
      url: '/api/drugsearch/personal-discounts',
      method: 'GET',
      params: { drugStoreId },
    },
    enabled: !!drugStoreId,
  })
}

/** POST /api/drugsearch/personal-discounts — upsert скидки (idempotent). */
export function useSavePersonalDiscount(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/drugsearch/personal-discounts', method: 'POST', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}

/** DELETE /api/drugsearch/personal-discounts?drugStoreId=N&distributorId=M */
export function useDeletePersonalDiscount(onSuccess?: () => void) {
  return useQueryApiClient({
    request: { url: '/api/drugsearch/personal-discounts', method: 'DELETE', disableOnMount: true },
    onSuccess: () => onSuccess?.(),
  })
}
