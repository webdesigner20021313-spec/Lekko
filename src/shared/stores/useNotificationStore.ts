import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Notification } from '@/shared/data/types'

/**
 * Уведомления хранятся **в localStorage браузера** под ключом `lekko-notifications`.
 *   • read/unread статус сохраняется между сессиями (закрыл вкладку → не теряется);
 *   • при logout useAuthStore зовёт reset() — список чистится;
 *   • сервер ничего не знает о read-статусе — это клиентское состояние.
 *
 * Реалтайм-уведомления (SignalR OrderStatusChanged) пушит useOrderNotifications.
 * Лимит — 50 последних, чтобы localStorage не разрастался.
 */
interface NotificationState {
  notifications: Notification[]
  markAsRead: (id: string) => void
  markAllRead: () => void
  unreadCount: () => number
  reset: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
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
      reset: () => set({ notifications: [] }),
    }),
    {
      name: 'lekko-notifications',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ notifications: s.notifications }),
    },
  ),
)
