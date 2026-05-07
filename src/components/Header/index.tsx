import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Search,
  LogOut,
  CheckCheck,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { detectMode } from '@/config/mode'
import { getLogoForMode, getLogoDarkForMode } from '@/config/products'
import { useUIStore } from '@/shared/stores/useUIStore'
import { useUserStore } from '@/shared/stores/useUserStore'
import { useNotificationStore } from '@/shared/stores/useNotificationStore'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useToast } from '@/shared/ui-kit/Toaster'
import { formatDateTime } from '@/shared/utils/format'

export function Header() {
  const { t } = useTranslation()
  const appMode = detectMode()
  const { language, setLanguage, theme, setTheme } = useUIStore()
  const logoSvg = theme === 'dark'
    ? getLogoDarkForMode(appMode.productId)
    : getLogoForMode(appMode.productId)
  const { user } = useUserStore()
  const { notifications, markAsRead, markAllRead, unreadCount } = useNotificationStore()
  const logout = useAuthStore((s) => s.logout)
  const { toast } = useToast()
  const navigate = useNavigate()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfile(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
        setSearchQuery('')
      }
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setShowLang(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowProfile(false)
        setShowSearch(false)
        setShowLang(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const searchablePages = [
    { label: t('search_page_purchase'),    path: '/purchase',    section: t('search_section_procurement') },
    { label: t('search_page_need'),        path: '/need',        section: t('search_section_procurement') },
    { label: t('search_page_cart'),        path: '/cart',        section: t('search_section_procurement') },
    { label: t('search_page_orders'),      path: '/orders',      section: t('search_section_orders') },
    { label: t('search_page_wholesalers'), path: '/wholesalers', section: t('search_section_references') },
  ]

  const filteredPages =
    searchQuery.length >= 1
      ? searchablePages.filter(
          (p) =>
            p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.section.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : []

  const unread = unreadCount()
  const langLabels: Record<string, string> = { uz: 'UZ', ru: 'RU' }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 dark:border-[#333333] dark:bg-[#111111]">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div
          className="flex cursor-pointer items-center select-none"
          onClick={() => navigate('/')}
        >
          <img src={logoSvg} alt="Lekko" className="h-8 w-auto" />
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative">
          <label className="flex h-10 w-[260px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 transition-colors focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/10 hover:border-gray-300 dark:border-gray-700 dark:bg-[#111111] dark:focus-within:border-gray-600 dark:focus-within:ring-gray-400/10 dark:hover:border-gray-600">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-gray-300"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
              >
                ×
              </button>
            )}
          </label>

          {showSearch && filteredPages.length > 0 && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[260px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              {filteredPages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => {
                    navigate(page.path)
                    setSearchQuery('')
                    setShowSearch(false)
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{page.label}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-[#222222] dark:text-gray-400">
                    {page.section}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showSearch && searchQuery.length >= 1 && filteredPages.length === 0 && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[260px] rounded-xl border border-gray-200 bg-white py-4 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              <p className="text-center text-sm text-gray-400">{t('search_not_found')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Language switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => { setShowLang(!showLang); setShowNotifications(false); setShowProfile(false) }}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors',
              showLang
                ? 'border-gray-300 bg-gray-100 text-gray-900 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-100'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
            )}
          >
            <span>{langLabels[language]}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {showLang && (
            <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[80px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              {(['uz', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLang(false) }}
                  className={cn(
                    'flex w-full items-center justify-center py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                    language === lang ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-[#929292]'
                  )}
                >
                  {langLabels[lang]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowLang(false) }}
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
              showNotifications
                ? 'border-gray-300 bg-gray-100 text-gray-900 dark:border-gray-600 dark:bg-[#222222] dark:text-gray-100'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
            )}
            aria-label={t('notifications')}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-[#333333]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('notifications')}</h3>
                  {unread > 0 && (
                    <span className="rounded-full bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-medium text-[#991B1B]">
                      {unread}
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="flex items-center gap-1 text-xs font-medium text-[#3872FA] transition-colors hover:text-blue-700"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    {t('read_all')}
                  </button>
                )}
              </div>

              <div className="max-h-[340px] overflow-y-auto">
                {notifications.slice(0, 7).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                      !n.read && 'bg-gray-50 dark:bg-[#222222]/50'
                    )}
                  >
                    <span className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      n.type === 'success' && 'bg-[#065F46]',
                      n.type === 'info' && 'bg-[#3872FA]',
                      n.type === 'warning' && 'bg-[#92400E]',
                      n.type === 'error' && 'bg-[#991B1B]',
                      n.read && 'opacity-30'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        'text-sm',
                        n.read ? 'font-normal text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-gray-100'
                      )}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{n.message}</p>
                      <p className="mt-1 text-[11px] text-gray-300 dark:text-gray-600">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3872FA]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 px-4 py-2.5 dark:border-[#333333]">
                <button className="text-xs font-medium text-[#3872FA] hover:underline">
                  {t('all_notifications')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowLang(false) }}
            className={cn(
              'flex items-center gap-2.5 rounded-lg p-1.5 pr-3 transition-colors',
              showProfile ? 'bg-gray-100 dark:bg-[#222222]' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white shadow-sm">
              {user.avatar}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">{user.name}</p>
              <p className="mt-0.5 text-[11px] leading-none text-gray-400">{user.role}</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-[#111111]">
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-[#333333]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {user.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                  <p className="truncate text-xs text-gray-400">{user.email}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 py-1 dark:border-[#333333]">
                <button
                  onClick={() => {
                    setShowProfile(false)
                    logout()
                    navigate('/login', { replace: true })
                    toast({ title: t('logout_toast_title'), description: t('logout_toast_desc'), variant: 'default' })
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
