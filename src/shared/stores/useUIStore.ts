import { create } from 'zustand'
import i18n from '@/shared/i18n'

interface UIState {
  language: 'uz' | 'ru'
  setLanguage: (lang: 'uz' | 'ru') => void
}

export const useUIStore = create<UIState>((set) => ({
  language: 'ru',
  setLanguage: (lang) => {
    i18n.changeLanguage(lang)
    set({ language: lang })
  },
}))
