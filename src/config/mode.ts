export type Mode = 'portal' | 'standalone'
export type ProductId = 'megaprice' | 'apteka' | 'analytic'

export interface AppMode {
  mode: Mode
  productId: ProductId | null
}

const STORAGE_KEY = 'lekko-dev-mode'
const VALID_OVERRIDES = ['portal', 'megaprice', 'apteka', 'analytic', 'reset'] as const
type Override = (typeof VALID_OVERRIDES)[number]

function modeFromOverride(value: Exclude<Override, 'reset'>): AppMode {
  if (value === 'portal') return { mode: 'portal', productId: null }
  return { mode: 'standalone', productId: value }
}

function fromHostname(host: string): AppMode {
  if (host.includes('platform.lekko')) return { mode: 'portal', productId: null }
  if (host.includes('apteka'))    return { mode: 'standalone', productId: 'apteka' }
  if (host.includes('analytic'))  return { mode: 'standalone', productId: 'analytic' }
  if (host.includes('megaprice')) return { mode: 'standalone', productId: 'megaprice' }
  return { mode: 'standalone', productId: 'megaprice' }
}

export function detectMode(): AppMode {
  if (typeof window === 'undefined') return { mode: 'standalone', productId: 'megaprice' }

  const params = new URLSearchParams(window.location.search)
  const queryMode = params.get('mode')
  if (queryMode && (VALID_OVERRIDES as readonly string[]).includes(queryMode)) {
    if (queryMode === 'reset') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, queryMode)
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (VALID_OVERRIDES as readonly string[]).includes(stored) && stored !== 'reset') {
    return modeFromOverride(stored as Exclude<Override, 'reset'>)
  }

  return fromHostname(window.location.hostname)
}

export function setDevMode(value: Exclude<Override, 'reset'> | 'reset'): void {
  if (value === 'reset') {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, value)
  }
  window.location.href = '/'
}

export function getStoredDevMode(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}
