import { create } from 'zustand'
import type { Notification } from '@/shared/data/types'
import { mockNotifications } from '@/shared/data/notifications'

interface NotificationState {
  notifications: Notification[]
  markAsRead: (id: string) => void
  markAllRead: () => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
