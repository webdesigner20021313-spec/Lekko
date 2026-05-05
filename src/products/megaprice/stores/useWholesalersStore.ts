import { create } from 'zustand'

// Keyed by distributor name (same names in wholesalers & purchase mocks)
// Only contains discounts explicitly set by the user — empty at start
interface WholesalersState {
  discounts: Record<string, number | null>   // name → discountPercent (user-set only)
  setDiscount: (name: string, discount: number | null) => void
  getDiscount: (name: string) => number | null
}

export const useWholesalersStore = create<WholesalersState>((set, get) => ({
  discounts: {},  // starts empty — badge only shows after user sets a discount

  setDiscount: (name, discount) =>
    set(state => ({ discounts: { ...state.discounts, [name]: discount } })),

  getDiscount: (name) => {
    const val = get().discounts[name]
    return val !== undefined ? val : null
  },
}))
