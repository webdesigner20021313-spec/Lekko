import { useAuthStore } from '@/shared/auth/useAuthStore'

/**
 * Режим «только просмотр» для megaprice. Включается, когда вошёл дистрибьютор
 * (authType=distributor → userType='distributor'). Дистр может смотреть прайс,
 * дистрибуторов и их items, но покупать/заказывать не может (кнопки disabled).
 * Функционально мутации и так не проходят — у дистра нет drugStoreId.
 */
export function useIsReadOnly(): boolean {
  return useAuthStore((s) => s.user?.userType === 'distributor')
}
