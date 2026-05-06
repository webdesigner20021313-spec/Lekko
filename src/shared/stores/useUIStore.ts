import { create } from 'zustand'
import i18n from '@/shared/i18n'

interface UIState {
  language: 'uz' | 'ru'
  setLanguage: (lang: 'uz' | 'ru') => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>((set) => ({
  language: 'ru',
  setLanguage: (lang) => {
    i18n.changeLanguage(lang)
    set({ language: lang })
  },
  theme: 'light',
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
}))
