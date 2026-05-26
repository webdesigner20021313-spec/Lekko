/**
 * Дефолтные данные корзины для демонстрации.
 * Загружаются при первом открытии приложения.
 *
 * 9 позиций от 3 оптовиков:
 *   MEDSERVICE    — 5 препаратов
 *   PHARMEX       — 2 препарата
 *   TURON PHARM   — 2 препарата
 */

import { mockMedicines, mockSupplierOffers } from './purchase.mocks'
import type { CartItem } from '@/products/megaprice/pages/purchase/types/purchase.types'

function item(offerId: string, qty: number, extras?: Partial<CartItem>): CartItem | null {
  const offer    = mockSupplierOffers.find(o => o.id === offerId)
  const medicine = offer ? mockMedicines.find(m => m.id === offer.medicineId) : undefined
  if (!offer || !medicine) return null
  return { offerId, medicineId: medicine.id, quantity: qty, offer, medicine, ...extras }
}

export const demoCartItems: CartItem[] = [
  // MEDSERVICE (d1)
  item('o1',  2),                                        // Вольтарен Эмульгель — 4 500 ₽ × 2
  item('o9',  5),                                        // Нурофен для детей    — 1 200 ₽ × 5
  item('o14', 3, { priceChangedFrom: 2950 }),            // Амоксициллин (демо: цена изменилась с 2 950 → 3 200)
  item('o22', 10),                                       // Лоратадин            — 850 ₽ × 10
  item('o34', 4),                                        // Но-шпа               — 2 200 ₽ × 4

  // PHARMEX (d2)
  item('o7',  2),                                        // Синекод              — 2 300 ₽ × 2
  item('o27', 6, { unavailable: true }),                 // Бисопролол (демо: товар недоступен у дистрибутора)

  // TURON PHARM (d3)
  item('o24', 8),                                        // Цетиризин            — 920 ₽ × 8
  item('o38', 1),                                        // Актовегин р-р д/ин   — 11 500 ₽ × 1
].filter(Boolean) as CartItem[]
