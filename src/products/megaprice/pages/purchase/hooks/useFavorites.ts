import { create } from 'zustand'

interface FavoritesState {
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  favoriteIds: [],

  toggleFavorite: (id) => {
    set((state) => {
      const exists = state.favoriteIds.includes(id)
      return {
        favoriteIds: exists
          ? state.favoriteIds.filter((fid) => fid !== id)
          : [...state.favoriteIds, id],
      }
    })
  },

  isFavorite: (id) => {
    return get().favoriteIds.includes(id)
  },
}))
