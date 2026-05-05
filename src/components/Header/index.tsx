import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  LogOut,
  CheckCheck,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { detectMode } from '@/config/mode'
import { getLogoForMode } from '@/config/products'
import { useUIStore } from '@/shared/stores/useUIStore'
import { useUserStore } from '@/shared/stores/useUserStore'
import { useNotificationStore } from '@/shared/stores/useNotificationStore'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useToast } from '@/shared/ui-kit/Toaster'
import { formatDateTime } from '@/shared/utils/format'

const searchablePages = [
  { label: 'Магазин', path: '/purchase', section: 'Закупки' },
  { label: 'Потребность', path: '/need', section: 'Закупки' },
  { label: 'Корзина', path: '/cart', section: 'Закупки' },
  { label: 'История заказов', path: '/orders', section: 'Заказы' },
  { label: 'Дистрибуторы', path: '/wholesalers', section: 'Справочники' },
]

export function Header() {
  const appMode = detectMode()
  const logoSvg = getLogoForMode(appMode.productId)
  const { language, setLanguage } = useUIStore()
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

  const filteredPages =
    searchQuery.length >= 1
      ? searchablePages.filter(
          (p) =>
            p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.section.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : []

  const unread = unreadCount()

  const langLabels: Record<string, string> = { uz: 'UZ', ru: 'RU', en: 'EN' }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div
          className="flex cursor-pointer items-center select-none"
          onClick={() => navigate('/')}
        >
          <img src={logoSvg} alt="Lekko" className="h-8 w-auto" />
        </div>

        {/* Divider */}

        {/* Search */}
        <div ref={searchRef} className="relative">
          <label className="flex h-10 w-[260px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 transition-colors focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/10 hover:border-gray-300">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск страниц и разделов..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                className="text-gray-300 hover:text-gray-500"
              >
                ×
              </button>
            )}
          </label>

          {/* Search dropdown */}
          {showSearch && filteredPages.length > 0 && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[260px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
              {filteredPages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => {
                    navigate(page.path)
                    setSearchQuery('')
                    setShowSearch(false)
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">{page.label}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                    {page.section}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showSearch && searchQuery.length >= 1 && filteredPages.length === 0 && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[260px] rounded-xl border border-gray-200 bg-white py-4 shadow-lg">
              <p className="text-center text-sm text-gray-400">Ничего не найдено</p>
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
                ? 'border-gray-300 bg-gray-100 text-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            <span>{langLabels[language]}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {showLang && (
            <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[80px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {(['uz', 'ru', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLang(false) }}
                  className={cn(
                    'flex w-full items-center justify-center py-2 text-sm font-medium transition-colors hover:bg-gray-50',
                    language === lang ? 'text-[#3872FA]' : 'text-gray-700'
                  )}
                >
                  {langLabels[lang]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowLang(false) }}
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
              showNotifications
                ? 'border-gray-300 bg-gray-100 text-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            )}
            aria-label="Уведомления"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] rounded-xl border border-gray-200 bg-white shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">Уведомления</h3>
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
                    Прочитать все
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[340px] overflow-y-auto">
                {notifications.slice(0, 7).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      !n.read && 'bg-gray-50'
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
                        n.read ? 'font-normal text-gray-600' : 'font-semibold text-gray-900'
                      )}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{n.message}</p>
                      <p className="mt-1 text-[11px] text-gray-300">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3872FA]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-4 py-2.5">
                <button className="text-xs font-medium text-[#3872FA] hover:underline">
                  Все уведомления →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowLang(false) }}
            className={cn(
              'flex items-center gap-2.5 rounded-lg p-1.5 pr-3 transition-colors',
              showProfile ? 'bg-gray-100' : 'hover:bg-gray-50'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white shadow-sm">
              {user.avatar}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-semibold leading-none text-gray-900">{user.name}</p>
              <p className="mt-0.5 text-[11px] leading-none text-gray-400">{user.role}</p>
            </div>
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
              {/* User header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {user.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="truncate text-xs text-gray-400">{user.email}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => {
                    setShowProfile(false)
                    logout()
                    navigate('/login', { replace: true })
                    toast({ title: 'Вы вышли из системы', description: 'До свидания!', variant: 'default' })
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
