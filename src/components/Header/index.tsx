import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Search,
  LogOut,
  CheckCheck,
  ChevronDown,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { detectMode } from '@/config/mode'
import { getLogoForMode, getLogoDarkForMode } from '@/config/products'
import { useUIStore } from '@/shared/stores/useUIStore'
import { useNotificationStore } from '@/shared/stores/useNotificationStore'
import { useMobileHeaderStore } from '@/shared/stores/useMobileHeaderStore'
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
  const authUser = useAuthStore((s) => s.user)
  const user = authUser ?? { name: '', email: '', role: '', avatar: '' }
  const { notifications, markAsRead, markAllRead, unreadCount } = useNotificationStore()
  const mobileHeaderActions = useMobileHeaderStore((s) => s.actions)
  const mobileHeaderSearch  = useMobileHeaderStore((s) => s.search)
  const mobileHeaderTitle   = useMobileHeaderStore((s) => s.title)
  const mobileHeaderBack    = useMobileHeaderStore((s) => s.onBack)
  const logout = useAuthStore((s) => s.logout)
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Мобильный header внутри раздела: ← / название / (правый слот — пока пусто).
  // На главной (/, /megaprice, /apteka, /analytic в portal) показываем лого + bell.
  const PRODUCT_ROOTS = ['megaprice', 'apteka', 'analytic']
  const SECTION_TITLE_KEYS: Record<string, string> = {
    purchase:    'nav_purchase',
    need:        'nav_need',
    cart:        'nav_cart',
    orders:      'nav_orders',
    wholesalers: 'nav_wholesalers',
    users:       'nav_users',
  }
  const rawSegs = location.pathname.split('/').filter(Boolean)
  const segs = rawSegs.length > 0 && PRODUCT_ROOTS.includes(rawSegs[0])
    ? rawSegs.slice(1)
    : rawSegs
  const isMobileSection = segs.length > 0
  const sectionRoot = segs[0] ?? null
  // Для подмаршрутов типа /users/roles берём более конкретный ключ
  const nestedKey = segs.length >= 2 ? `nav_${segs[1]}` : null
  const sectionTitleKey =
    (nestedKey && (nestedKey === 'nav_roles' ? nestedKey : null)) ??
    (sectionRoot ? SECTION_TITLE_KEYS[sectionRoot] : null)

  const handleBack = () => {
    // Если страница зарегистрировала свой обработчик back — он имеет приоритет
    // (например, закрытие in-page detail-view вместо ухода на родительский маршрут).
    if (mobileHeaderBack) {
      mobileHeaderBack()
      return
    }
    // Поднимаемся на уровень выше в пути; для /cart -> /, для /orders/123 -> /orders.
    // Если родитель — голый корень продукта (/megaprice, /apteka, /analytic),
    // пропускаем его и идём сразу на /, иначе главная показывает только этот
    // продукт (scope='megaprice') без остальных разделов портала.
    let parent: string
    if (rawSegs.length <= 1) {
      parent = '/'
    } else if (rawSegs.length === 2 && PRODUCT_ROOTS.includes(rawSegs[0])) {
      parent = '/'
    } else {
      parent = '/' + rawSegs.slice(0, -1).join('/')
    }
    navigate(parent)
  }

  // Когда мобильный search-инпут в фокусе — расширяем его на правый action-слот.
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false)
  useEffect(() => { setMobileSearchFocused(false) }, [location.pathname])

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Desktop refs
  const notifRef    = useRef<HTMLDivElement>(null)
  const profileRef  = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLDivElement>(null)
  const langRef     = useRef<HTMLDivElement>(null)
  // Mobile refs (профиль перенесён на MobileHome)
  const mNotifRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      if (profileRef.current && !profileRef.current.contains(t)) setShowProfile(false)
      const inNotif = notifRef.current?.contains(t) || mNotifRef.current?.contains(t)
      if (!inNotif) setShowNotifications(false)
      if (searchRef.current  && !searchRef.current.contains(t))  { setShowSearch(false); setSearchQuery('') }
      if (langRef.current    && !langRef.current.contains(t))    setShowLang(false)
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

  const filteredPages = searchQuery.length >= 1
    ? searchablePages.filter((p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.section.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const unread = unreadCount()
  const langLabels: Record<string, string> = { uz: 'UZ', ru: 'RU' }

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white dark:border-[#333333] dark:bg-[#090909]">

      {/* ═══ MOBILE (< md) ═══════════════════════════════════════════════════════ */}
      {isMobileSection ? (
        // Внутри раздела: ← / [заголовок ИЛИ input] / action'ы.
        // Заголовок позиционируем абсолютно — он всегда по центру viewport
        // независимо от количества action-иконок справа.
        // При фокусе search-инпута action'ы прячутся, input расширяется на их слот.
        <div className={cn(
          'relative h-14 px-3 md:hidden',
          mobileSearchFocused
            ? 'grid grid-cols-[auto_1fr] items-center gap-2'
            : 'flex items-center'
        )}>
          <button
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#222222]"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Центр: либо input (если страница регистрирует search), либо заголовок */}
          {mobileHeaderSearch ? (
            <div className="relative ml-2 min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={mobileHeaderSearch.value}
                onChange={(e) => mobileHeaderSearch.onChange(e.target.value)}
                onFocus={() => setMobileSearchFocused(true)}
                onBlur={() => setMobileSearchFocused(false)}
                placeholder={mobileHeaderSearch.placeholder}
                // text-base (16px) обязателен на мобиле, иначе iOS Safari зумит экран при фокусе
                className="h-11 w-full rounded-xl bg-gray-100 pl-9 pr-9 text-base text-gray-900 placeholder-gray-400 focus:outline-none dark:bg-[#222222] dark:text-gray-100 dark:placeholder-gray-500"
              />
              {mobileHeaderSearch.value && (
                <button
                  onClick={() => mobileHeaderSearch.onChange('')}
                  className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-[#333333]"
                  aria-label="Clear"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 truncate text-center text-[15px] font-semibold text-gray-900 max-w-[55%] dark:text-gray-50">
              {mobileHeaderTitle ?? (sectionTitleKey ? t(sectionTitleKey) : '')}
            </h1>
          )}

          {/* Правый слот — action'ы из useMobileHeaderActions(); прячем при фокусе на поиске.
              Когда показывается поиск (без actions) — слот не рендерится, чтобы input занял всю ширину. */}
          <div className={cn(
            'ml-auto flex items-center justify-end gap-1',
            mobileSearchFocused && 'hidden',
            mobileHeaderSearch && (!mobileHeaderActions || mobileHeaderActions.length === 0) && 'hidden',
          )}>
            {mobileHeaderActions && mobileHeaderActions.length > 0 ? (
              mobileHeaderActions.map((action) => {
                const Icon = action.icon
                const variant = action.variant ?? 'default'
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    aria-label={action.ariaLabel}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      variant === 'default' &&
                        'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#222222]',
                      variant === 'active' &&
                        'bg-gray-900 text-white dark:bg-[#f1f1f1] dark:text-gray-900',
                      variant === 'success' &&
                        'bg-green-600 text-white hover:bg-green-700',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {action.indicator && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#090909]" />
                    )}
                  </button>
                )
              })
            ) : (
              <span className="block h-9 w-9" />
            )}
          </div>
        </div>
      ) : (
        // Главная: профиль (слева) + лого (центр) + язык/bell (справа)
        <div className="relative flex h-14 items-center justify-between px-4 md:hidden">

          {/* Left — Profile avatar */}
          <button
            onClick={() => navigate('/profile')}
            aria-label={t('profile_title')}
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-[11px] font-bold text-white shadow-sm transition-opacity hover:opacity-90 dark:from-[#2a2a2a] dark:to-[#1a1a1a]"
          >
            {user.avatar || '?'}
          </button>

          {/* Center — Logo */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 cursor-pointer select-none"
            onClick={() => navigate('/')}
          >
            <img src={logoSvg} alt="Lekko" className="pointer-events-auto h-7 w-auto" />
          </div>

          {/* Right — Language + Bell */}
          <div className="flex items-center gap-1">

            {/* Language */}
            <button
              onClick={() => setLanguage(language === 'ru' ? 'uz' : 'ru')}
              aria-label={t('lang_label')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              {language}
            </button>

            {/* Bell */}
            <div ref={mNotifRef} className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#090909]">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-[#333333]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('notifications')}</h3>
                    {unread > 0 && (
                      <button onClick={() => markAllRead()} className="flex items-center gap-1 text-xs font-medium text-[#3872FA]">
                        <CheckCheck className="h-3.5 w-3.5" />
                        {t('read_all')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800',
                          !n.read && 'bg-gray-50 dark:bg-[#222222]/50'
                        )}
                      >
                        <span className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          n.type === 'success' && 'bg-[#065F46]',
                          n.type === 'info'    && 'bg-[#3872FA]',
                          n.type === 'warning' && 'bg-[#92400E]',
                          n.type === 'error'   && 'bg-[#991B1B]',
                          n.read && 'opacity-30'
                        )} />
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-sm', n.read ? 'font-normal text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-gray-100')}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{n.message}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ═══ DESKTOP (>= md) ═════════════════════════════════════════════════════ */}
      <div className="hidden h-16 items-center justify-between px-4 md:flex lg:px-6">

        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex cursor-pointer items-center select-none" onClick={() => navigate('/')}>
            <img src={logoSvg} alt="Lekko" className="h-8 w-auto" />
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative">
            <label className="flex h-10 w-[260px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 transition-colors focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/10 hover:border-gray-300 dark:border-gray-700 dark:bg-[#090909] dark:focus-within:border-gray-600 dark:focus-within:ring-gray-400/10 dark:hover:border-gray-600">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
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
              <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[260px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-[#090909]">
                {filteredPages.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => { navigate(page.path); setSearchQuery(''); setShowSearch(false) }}
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
              <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[260px] rounded-xl border border-gray-200 bg-white py-4 shadow-lg dark:border-gray-700 dark:bg-[#090909]">
                <p className="text-center text-sm text-gray-400">{t('search_not_found')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* Language */}
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
              <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[80px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#090909]">
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

          {/* Theme */}
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
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#090909]">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-[#333333]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('notifications')}</h3>
                    {unread > 0 && (
                      <span className="rounded-full bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-medium text-[#991B1B]">{unread}</span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button onClick={() => markAllRead()} className="flex items-center gap-1 text-xs font-medium text-[#3872FA] transition-colors hover:text-blue-700">
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
                        n.type === 'info'    && 'bg-[#3872FA]',
                        n.type === 'warning' && 'bg-[#92400E]',
                        n.type === 'error'   && 'bg-[#991B1B]',
                        n.read && 'opacity-30'
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm', n.read ? 'font-normal text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-gray-100')}>
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
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-[#090909]">
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
      </div>
    </header>
  )
}
