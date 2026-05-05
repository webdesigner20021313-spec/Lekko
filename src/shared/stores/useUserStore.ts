import { create } from 'zustand'
import type { UserProfile } from '@/shared/data/types'
import { mockUser } from '@/shared/data/user'

interface UserState {
  user: UserProfile
  updateProfile: (data: Partial<UserProfile>) => void
  updateNotificationPrefs: (prefs: Partial<UserProfile['notificationPrefs']>) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: mockUser,
  updateProfile: (data) =>
    set((s) => ({ user: { ...s.user, ...data } })),
  updateNotificationPrefs: (prefs) =>
    set((s) => ({
      user: {
        ...s.user,
        notificationPrefs: { ...s.user.notificationPrefs, ...prefs },
      },
    })),
}))
