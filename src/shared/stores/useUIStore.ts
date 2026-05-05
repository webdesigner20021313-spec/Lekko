import { create } from 'zustand'

interface UIState {
  language: 'uz' | 'ru' | 'en'
  setLanguage: (lang: 'uz' | 'ru' | 'en') => void
}

export const useUIStore = create<UIState>((set) => ({
  language: 'ru',
  setLanguage: (lang) => set({ language: lang }),
}))
