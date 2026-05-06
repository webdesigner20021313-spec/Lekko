import { create } from 'zustand'
import { mockOrders } from '@/products/megaprice/mocks/orders.mocks'
import type { Order } from '@/products/megaprice/pages/orders/types'

interface OrdersState {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrder: (order: Order) => void
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [...mockOrders],
  addOrder: (order) =>
    set(state => ({ orders: [order, ...state.orders] })),
  updateOrder: (order) =>
    set(state => ({ orders: state.orders.map(o => o.id === order.id ? order : o) })),
}))
