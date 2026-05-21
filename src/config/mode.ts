export type Mode = 'portal' | 'standalone'
export type ProductId = 'megaprice' | 'apteka' | 'analytic'

export interface AppMode {
  mode: Mode
  productId: ProductId | null
}

const VALID_OVERRIDES = ['portal', 'megaprice', 'apteka', 'analytic', 'reset'] as const
type Override = (typeof VALID_OVERRIDES)[number]

function modeFromOverride(value: Exclude<Override, 'reset'>): AppMode {
  if (value === 'portal') return { mode: 'portal', productId: null }
  return { mode: 'standalone', productId: value }
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host === ''
}

function fromHostname(host: string): AppMode {
  // localhost (dev) → портал по умолчанию (а не megaprice standalone).
  if (isLocalHost(host)) return { mode: 'portal', productId: null }
  if (host.includes('platform.lekko') || host.includes('github.io')) return { mode: 'portal', productId: null }
  if (host.includes('apteka'))    return { mode: 'standalone', productId: 'apteka' }
  if (host.includes('analytic'))  return { mode: 'standalone', productId: 'analytic' }
  if (host.includes('megaprice')) return { mode: 'standalone', productId: 'megaprice' }
  return { mode: 'standalone', productId: 'megaprice' }
}

/**
 * Режим определяется ТОЛЬКО по `?mode=` (transient, dev) и hostname.
 * В localStorage НИЧЕГО не сохраняем — никаких «залипших» режимов.
 * App кэширует результат один раз на сессию (см. App.tsx), чтобы режим не
 * слетал при SPA-навигации, теряющей query-параметр.
 */
export function detectMode(): AppMode {
  if (typeof window === 'undefined') return { mode: 'portal', productId: null }

  const queryMode = new URLSearchParams(window.location.search).get('mode')
  if (queryMode && queryMode !== 'reset' && (VALID_OVERRIDES as readonly string[]).includes(queryMode)) {
    return modeFromOverride(queryMode as Exclude<Override, 'reset'>)
  }
  return fromHostname(window.location.hostname)
}

/** Переключение режима (dev): перезагрузка с `?mode=`, без сохранения. */
export function setDevMode(value: Exclude<Override, 'reset'> | 'reset'): void {
  window.location.href = value === 'reset' || value === 'portal' ? '/' : `/?mode=${value}`
}
