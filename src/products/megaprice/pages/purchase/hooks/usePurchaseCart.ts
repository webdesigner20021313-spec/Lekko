import { create } from 'zustand'
import type { CartItem } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { demoCartItems } from '@/products/megaprice/mocks/demoCart'

interface PurchaseCartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQuantity: (offerId: string, quantity: number) => void
  removeItem: (offerId: string) => void
  clearCart: () => void
  getQuantity: (offerId: string) => number
  totalItems: () => number
}

export const usePurchaseCart = create<PurchaseCartState>((set, get) => ({
  items: demoCartItems,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.offerId === item.offerId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.offerId === item.offerId ? { ...i, quantity: item.quantity } : i
          ),
        }
      }
      return { items: [...state.items, item] }
    })
  },

  updateQuantity: (offerId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(offerId)
      return
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.offerId === offerId ? { ...i, quantity } : i
      ),
    }))
  },

  removeItem: (offerId) => {
    set((state) => ({
      items: state.items.filter((i) => i.offerId !== offerId),
    }))
  },

  clearCart: () => set({ items: [] }),

  getQuantity: (offerId) => {
    return get().items.find((i) => i.offerId === offerId)?.quantity ?? 0
  },

  totalItems: () => get().items.length,
}))
