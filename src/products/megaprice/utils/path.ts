import { detectMode } from '@/config/mode'

/**
 * Базовый путь для разделов Megaprice. В standalone — пусто (`'/cart'`),
 * в портале — `/megaprice` (`'/megaprice/cart'`).
 */
export function getMegapriceBase(): string {
  const m = detectMode()
  return m.mode === 'portal' ? '/megaprice' : ''
}

/** Префиксует путь раздела Megaprice. `mp('/cart')` → `/cart` или `/megaprice/cart`. */
export function mp(path: string): string {
  return `${getMegapriceBase()}${path}`
}
