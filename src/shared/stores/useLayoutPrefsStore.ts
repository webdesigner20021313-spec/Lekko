import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Пользовательские UI-preferences, общие на весь сайт.
 *
 * Сейчас хранится только `leftPanelPct` — ширина левой панели в split-layout'е
 * (PurchasePage / NeedPage / WholesalersTab). Раньше каждый tab имел свой state
 * (`splitPct` для manual/post + `wSplitPct` для wholesalers), и при переключении
 * между tab'ами ширина «прыгала». Теперь один store применяется ко всем tab'ам
 * и сохраняется в localStorage между сессиями.
 *
 * Per-user разделение через `lekko-layout-{drugStoreId}` ключ в localStorage —
 * см. `getStorageKey()`. При logout — store.reset() (auth-store его дёргает).
 *
 * Хранится 20..80 (процент). Default 36% (как было раньше).
 */
interface LayoutPrefsState {
  leftPanelPct: number
  setLeftPanelPct: (pct: number) => void
  reset: () => void
}

const DEFAULT_PCT = 36

// localStorage key включает drugStoreId, чтобы у разных пользователей в одном
// браузере были раздельные настройки. Если auth ещё не загружен — ключ
// `lekko-layout-anon`, перетрётся при первом setLeftPanelPct после логина.
function getStorageKey(): string {
  if (typeof window === 'undefined') return 'lekko-layout-anon'
  try {
    const authRaw = localStorage.getItem('lekko-auth')
    if (authRaw) {
      const auth = JSON.parse(authRaw)
      const dsId = auth?.state?.drugStore?.drugStoreId ?? auth?.drugStore?.drugStoreId
      if (dsId) return `lekko-layout-${dsId}`
    }
  } catch { /* ignore parse errors */ }
  return 'lekko-layout-anon'
}

export const useLayoutPrefsStore = create<LayoutPrefsState>()(
  persist(
    (set) => ({
      leftPanelPct: DEFAULT_PCT,
      setLeftPanelPct: (pct) => set({ leftPanelPct: Math.min(80, Math.max(20, pct)) }),
      reset: () => set({ leftPanelPct: DEFAULT_PCT }),
    }),
    {
      name: getStorageKey(),
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ leftPanelPct: s.leftPanelPct }),
    },
  ),
)
