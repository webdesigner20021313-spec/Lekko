import type { UserProfile } from './types'

export const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Алишер Каримов',
  email: 'alisher@megaprice.uz',
  role: 'Администратор',
  avatar: 'АК',
  notificationPrefs: {
    orderUpdates: true,
    priceChanges: true,
    stockAlerts: false,
    emailDigest: true,
  },
  posIntegration: {
    enabled: true,
    provider: 'PharmPOS',
    lastSync: '2026-04-12T09:30:00',
    status: 'connected',
  },
}
