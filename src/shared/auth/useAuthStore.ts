import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  name: string
  email: string
  role: string
  avatar: string
}

interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (login: string, password: string) => boolean
  logout: () => void
}

const MOCK_USERS = [
  {
    login: 'admin@megaprice.uz',
    password: 'Mega2026',
    user: {
      name: 'Алишер Каримов',
      email: 'admin@megaprice.uz',
      role: 'Администратор',
      avatar: 'АК',
    },
  },
  {
    login: 'manager@megaprice.uz',
    password: 'Manager2026',
    user: {
      name: 'Зафар Рахимов',
      email: 'manager@megaprice.uz',
      role: 'Менеджер',
      avatar: 'ЗР',
    },
  },
  {
    login: 'operator@megaprice.uz',
    password: 'Operator2026',
    user: {
      name: 'Бобур Тошматов',
      email: 'operator@megaprice.uz',
      role: 'Оператор',
      avatar: 'БТ',
    },
  },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (login, password) => {
        const found = MOCK_USERS.find(
          (u) => u.login === login.trim() && u.password === password
        )
        if (found) {
          set({ isAuthenticated: true, user: found.user })
          return true
        }
        return false
      },

      logout: () => {
        // Reset Zustand state
        set({ isAuthenticated: false, user: null })
        // Belt-and-suspenders: explicitly drop the persisted key so a stale
        // copy from a previous session can never resurrect the auth state
        // (e.g. on a tab that didn't see the rehydrate event).
        try {
          localStorage.removeItem('megaprice-auth')
        } catch {
          // ignore — private mode or storage disabled
        }
      },
    }),
    {
      name: 'megaprice-auth',
    }
  )
)
