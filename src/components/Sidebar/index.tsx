import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Store,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  Building2,
  Users,
  BarChart3,
  Cross,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
  ChevronDown,
  X,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { products, getLogoForMode, getLogoDarkForMode } from '@/config/products'
import { detectMode, type ProductId } from '@/config/mode'
import { useUIStore } from '@/shared/stores/useUIStore'

const iconMap: Record<string, LucideIcon> = {
  Store,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  Building2,
  Users,
  BarChart3,
  Cross,
}

function renderIcon(name: string, className = 'h-6 w-6'): React.ReactNode {
  const Icon = iconMap[name] ?? Store
  return <Icon className={className} />
}

interface SidebarProps {
  mode: 'portal' | 'standalone'
  productId?: ProductId
}

interface StandaloneNavItem {
  label: string
  slug: string
  path: string
  iconName: string
  end: boolean
}

interface PortalSubItem {
  label: string
  slug: string
  path: string
}

interface PortalCategory {
  id: 'megaprice' | 'analytic' | 'apteka' | 'users'
  label: string
  iconName: string
  domain?: string
  defaultPath: string
  matchPrefix: string
  subItems: PortalSubItem[]
  emptyMessage?: string
}

function buildPortalCategories(): PortalCategory[] {
  return [
    {
      id: 'megaprice',
      label: products.megaprice.name,
      iconName: 'Store',
      domain: products.megaprice.domain,
      defaultPath: `${products.megaprice.basePath}/${products.megaprice.sections[0]?.slug ?? ''}`,
      matchPrefix: products.megaprice.basePath,
      subItems: products.megaprice.sections.map((s) => ({
        label: s.label,
        slug: s.slug,
        path: `${products.megaprice.basePath}/${s.slug}`,
      })),
    },
    {
      id: 'analytic',
      label: products.analytic.name,
      iconName: 'BarChart3',
      domain: products.analytic.domain,
      defaultPath: products.analytic.basePath,
      matchPrefix: products.analytic.basePath,
      subItems: [],
    },
    {
      id: 'apteka',
      label: products.apteka.name,
      iconName: 'Cross',
      domain: products.apteka.domain,
      defaultPath: products.apteka.basePath,
      matchPrefix: products.apteka.basePath,
      subItems: [],
    },
    {
      id: 'users',
      label: 'users',
      iconName: 'Users',
      defaultPath: '/users',
      matchPrefix: '/users',
      subItems: [
        { label: 'users', slug: 'users', path: '/users' },
        { label: 'roles', slug: 'roles', path: '/users/roles' },
      ],
    },
  ]
}

function findActiveCategory(
  categories: PortalCategory[],
  pathname: string
): PortalCategory | null {
  return (
    categories.find((c) =>
      c.matchPrefix === '/' ? pathname === '/' : pathname.startsWith(c.matchPrefix)
    ) ?? null
  )
}

/* ─── Mobile Tab Bar (standalone) ───────────────────────────────────────────── */
function MobileTabBar({ items }: { items: StandaloneNavItem[] }) {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/10 bg-[#090909] pb-safe dark:bg-black md:hidden">
      {items.map((item) => {
        const isActive = item.end
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path)
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className="flex flex-col items-center gap-0.5 px-2 py-1"
          >
            <span
              className={cn(
                'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                isActive ? 'bg-white text-gray-900' : 'text-[#6B7280]'
              )}
            >
              {renderIcon(item.iconName, 'h-5 w-5')}
            </span>
            <span
              className={cn(
                'text-center text-[10px] leading-tight',
                isActive ? 'font-semibold text-white' : 'text-[#6B7280]'
              )}
            >
              {t(`nav_${item.slug}`, item.label)}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

/* ─── Mobile Full-Screen Drawer (portal) ─────────────────────────────────────── */
function MobilePortalDrawer({ categories }: { categories: PortalCategory[] }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { mobileMenuOpen, closeMobileMenu, theme, setTheme } = useUIStore()
  const appMode = detectMode()
  const logoSvg =
    theme === 'dark'
      ? getLogoDarkForMode(appMode.productId)
      : getLogoForMode(appMode.productId)

  const [expandedId, setExpandedId] = useState<string>(
    categories.find((c) => location.pathname.startsWith(c.matchPrefix))?.id ?? 'megaprice'
  )

  useEffect(() => {
    const active = categories.find((c) => location.pathname.startsWith(c.matchPrefix))
    if (active) setExpandedId(active.id)
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mobileMenuOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="flex h-full flex-col bg-white dark:bg-[#090909]">

        {/* Drawer header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-[#333333]">
          <img src={logoSvg} alt="Lekko" className="h-7 w-auto" />
          <button
            onClick={closeMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#222222]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {categories.map((cat) => {
            const isOnRoute = location.pathname.startsWith(cat.matchPrefix)
            const isExpanded = cat.id === expandedId

            return (
              <div key={cat.id} className="mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(cat.id)
                    if (!location.pathname.startsWith(cat.matchPrefix)) {
                      navigate(cat.defaultPath)
                    }
                    if (cat.subItems.length === 0) closeMobileMenu()
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                    isOnRoute
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#222222]'
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    {renderIcon(cat.iconName, 'h-5 w-5')}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {cat.id === 'users' ? t('nav_users') : cat.label}
                  </span>
                  {cat.subItems.length > 0 && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  )}
                </button>

                {isExpanded && cat.subItems.length > 0 && (
                  <div className="ml-12 mt-0.5 flex flex-col gap-0.5">
                    {cat.subItems.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        end={sub.path === '/users'}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-gray-100 font-medium text-gray-900 dark:bg-[#222222] dark:text-white'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#1a1a1a] dark:hover:text-white'
                          )
                        }
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                        <span>{t(`nav_${sub.slug}`, sub.label)}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Theme toggle */}
        <div className="shrink-0 border-t border-gray-200 px-4 py-3 dark:border-[#333333]">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#222222]"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span>{theme === 'light' ? t('theme_dark') : t('theme_light')}</span>
          </button>
        </div>

      </div>
    </div>
  )
}

/* ─── Standalone Sidebar ─────────────────────────────────────────────────────── */
function StandaloneSidebar({ productId }: { productId: ProductId }) {
  const { t } = useTranslation()
  const location = useLocation()
  const product = products[productId]

  const items: StandaloneNavItem[] = product.sections.map((s) => ({
    label: s.label,
    slug: s.slug,
    path: `/${s.slug}`,
    iconName: s.iconName,
    end: s.slug !== 'orders',
  }))

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden h-screen w-[140px] shrink-0 flex-col bg-[#090909] dark:bg-black md:flex">
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10" />

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          <ul className="flex flex-col items-center gap-1 px-2">
            {items.map((item) => {
              const isActive = item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path)
              return (
                <li key={item.path} className="w-full">
                  <NavLink
                    to={item.path}
                    end={item.end}
                    title={t(`nav_${item.slug}`, item.label)}
                    className="group flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all duration-150"
                  >
                    <span
                      className={cn(
                        'flex h-[40px] w-[108px] shrink-0 items-center justify-center rounded-[120px] transition-all duration-150',
                        isActive
                          ? 'bg-white text-gray-900'
                          : 'text-[#6B7280] dark:text-[#929292] group-hover:text-stone-300'
                      )}
                    >
                      {renderIcon(item.iconName)}
                    </span>
                    <span
                      className={cn(
                        'text-center text-[16px] leading-tight',
                        isActive
                          ? 'font-semibold text-white'
                          : 'font-normal text-[#6B7280] dark:text-[#929292] group-hover:text-stone-300'
                      )}
                    >
                      {t(`nav_${item.slug}`, item.label)}
                    </span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-[#6B7280] dark:border-[#929292] py-[16px]">
          <p className="text-center text-[14px] text-[#6B7280] dark:text-[#929292]">v1.0.3</p>
        </div>
      </aside>

      {/* Mobile tab bar — скрыт по запросу. Если понадобится вернуть: раскомментировать строку ниже. */}
      {/* <MobileTabBar items={items} /> */}
    </>
  )
}

/* ─── Portal Sidebar ─────────────────────────────────────────────────────────── */
const COLLAPSE_STORAGE_KEY = 'lekko-sidebar-collapsed'

function PortalSidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const categories = buildPortalCategories()

  const activeFromUrl = findActiveCategory(categories, location.pathname)
  const [expandedId, setExpandedId] = useState<PortalCategory['id']>(
    activeFromUrl?.id ?? 'megaprice'
  )
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    if (activeFromUrl && activeFromUrl.id !== expandedId) {
      setExpandedId(activeFromUrl.id)
    }
  }, [activeFromUrl, expandedId])

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const expanded = categories.find((c) => c.id === expandedId) ?? categories[0]

  function getCategoryLabel(cat: PortalCategory): string {
    if (cat.id === 'users') return t('nav_users')
    return cat.label
  }

  function getSubItemLabel(item: PortalSubItem): string {
    return t(`nav_${item.slug}`, item.label)
  }

  function handleCategoryClick(category: PortalCategory) {
    setExpandedId(category.id)
    if (collapsed) setCollapsed(false)
    if (!location.pathname.startsWith(category.matchPrefix)) {
      navigate(category.defaultPath)
    }
  }

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden h-screen shrink-0 md:flex">
        {/* Outer icon column */}
        <div className="flex w-[96px] shrink-0 flex-col bg-[#090909] dark:bg-black">
          <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? t('sidebar_expand') : t('sidebar_collapse')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
            <ul className="flex flex-col items-center gap-1 px-2">
              {categories.map((cat) => {
                const isExpanded = cat.id === expandedId
                const isOnRoute = location.pathname.startsWith(cat.matchPrefix)
                return (
                  <li key={cat.id} className="w-full">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      title={getCategoryLabel(cat)}
                      className="group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all duration-150"
                    >
                      <span
                        className={cn(
                          'flex h-[40px] w-[72px] shrink-0 items-center justify-center rounded-[120px] transition-all duration-150',
                          isOnRoute
                            ? 'bg-white text-gray-900'
                            : isExpanded
                            ? 'bg-white/10 text-white'
                            : 'text-[#6B7280] dark:text-[#929292] group-hover:text-stone-300'
                        )}
                      >
                        {renderIcon(cat.iconName)}
                      </span>
                      <span
                        className={cn(
                          'text-center text-[12px] leading-tight',
                          isOnRoute
                            ? 'font-semibold text-white'
                            : isExpanded
                            ? 'font-medium text-white'
                            : 'font-normal text-[#6B7280] dark:text-[#929292] group-hover:text-stone-300'
                        )}
                      >
                        {getCategoryLabel(cat)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-[#6B7280] dark:border-[#929292] py-[16px]">
            <p className="text-center text-[12px] text-[#6B7280] dark:text-[#929292]">v1.0.3</p>
          </div>
        </div>

        {/* Expanded sub-items panel */}
        {collapsed ? null : (
          <div className="flex w-[200px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-white/10 dark:bg-[#090909]">
            <div className="flex h-16 shrink-0 items-center gap-2 px-3">
              <span className="flex-1 text-[15px] font-semibold text-gray-900 dark:text-white">
                {getCategoryLabel(expanded)}
              </span>
              {expanded.domain && (
                <a
                  href={`https://${expanded.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('sidebar_open_domain', { domain: expanded.domain })}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#929292]">
              {t('sidebar_sections_label')}
            </div>

            <nav className="flex-1 overflow-y-auto px-2 pb-3">
              {expanded.subItems.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400 dark:text-[#929292]">
                  {t('sidebar_in_development')}
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {expanded.subItems.map((s) => (
                    <li key={s.path}>
                      <NavLink
                        to={s.path}
                        end={s.path === '/users'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                          )
                        }
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                        <span>{getSubItemLabel(s)}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          </div>
        )}
      </aside>

      {/* Mobile full-screen drawer */}
      <MobilePortalDrawer categories={categories} />
    </>
  )
}

/* ─── Export ─────────────────────────────────────────────────────────────────── */
export function Sidebar({ mode, productId }: SidebarProps) {
  if (mode === 'standalone' && productId) {
    return <StandaloneSidebar productId={productId} />
  }
  return <PortalSidebar />
}
