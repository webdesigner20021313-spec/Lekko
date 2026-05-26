import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Sun, Moon, Mail } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useUIStore } from '@/shared/stores/useUIStore'
import { useToast } from '@/shared/ui-kit/Toaster'

/**
 * Простая страница профиля — открывается из V2-мобильной главной по нажатию
 * на блок профиля в burger-drawer. На десктопе просто показывает ту же
 * информацию (выглядит ок и там, но из навигации портала на неё ссылок нет).
 */
export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, setTheme } = useUIStore()
  const { toast } = useToast()

  const user = authUser ?? { name: '', email: '', role: '', avatar: '?' }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    toast({ title: t('logout_toast_title'), description: t('logout_toast_desc'), variant: 'default' })
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">

        {/* Identity card */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#262626] dark:bg-[#171717]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-base font-bold text-white dark:from-[#2a2a2a] dark:to-[#1a1a1a]">
            {user.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-gray-900 dark:text-gray-50">{user.name}</p>
            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-[#929292]">{user.role}</p>
          </div>
        </div>

        {/* Account info */}
        <p className="mt-6 mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#5e5e5e]">
          {t('profile_account')}
        </p>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-[#262626] dark:bg-[#171717]">
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
              {user.email || '—'}
            </span>
          </div>
        </div>

        {/* Settings */}
        <p className="mt-6 mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#5e5e5e]">
          {t('profile_settings')}
        </p>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-[#262626] dark:bg-[#171717]">

          {/* Theme */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#5e5e5e]">
              {t('theme_label')}
            </p>
            <div className="flex gap-2">
              {([
                { key: 'light' as const, icon: Sun,  label: t('theme_light') },
                { key: 'dark'  as const, icon: Moon, label: t('theme_dark') },
              ]).map(({ key, icon: Icon, label }) => {
                const active = theme === key
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors',
                      active
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-[#222222] dark:text-gray-300 dark:hover:bg-[#2a2a2a]',
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:bg-[#171717] dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </div>
    </div>
  )
}
