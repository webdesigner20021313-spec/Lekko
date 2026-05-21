import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { AutoSelectOffer } from '@/products/megaprice/api/hooks'

/** Передаётся в onConfirm/handleConfirm. Сейчас не используется напрямую —
 *  модалка сама добавляет в корзину, родителю просто приходит количество. */
export interface AutoSelectResult {
  medicine: Medicine
  offer: AutoSelectOffer | null
}

export interface LocalResult {
  medicine: Medicine
  offer: AutoSelectOffer | null
  reason: 'ok' | 'no_offers' | 'filtered_out'
  /** Средняя цена drug'а (до фильтров) — для подсказки в UI. */
  avgPrice?: number | null
}

// Пустой массив = нет ограничений
// Иерархия алгоритма: дата → город → дистрибутор → производитель → цена
export interface Settings {
  cityFilter:        string[]
  supplierIds:       string[]
  manufacturerNames: string[]
  priceDeviationPct: string
  /** Возраст прайса в днях. null = «за всё время» (бэк-default). */
  priceAgeDays:      number | null
}

export interface TagOption {
  id: string
  label: string
  sublabel?: string
}
