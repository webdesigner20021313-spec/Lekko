import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Store,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  Building2,
  Users,
  BarChart3,
  Pill,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { products } from '@/config/products'
import type { ProductId } from '@/config/mode'

const iconMap: Record<string, LucideIcon> = {
  Store,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  Building2,
  Users,
  BarChart3,
  Pill,
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
  path: string
  iconName: string
  end: boolean
}

interface PortalSubItem {
  label: string
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
      label: 'Mega price',
      iconName: 'Store',
      domain: products.megaprice.domain,
      defaultPath: `${products.megaprice.basePath}/${products.megaprice.sections[0]?.slug ?? ''}`,
      matchPrefix: products.megaprice.basePath,
      subItems: products.megaprice.sections.map((s) => ({
        label: s.label,
        path: `${products.megaprice.basePath}/${s.slug}`,
      })),
    },
    {
      id: 'analytic',
      label: 'Analytic',
      iconName: 'BarChart3',
      domain: products.analytic.domain,
      defaultPath: products.analytic.basePath,
      matchPrefix: products.analytic.basePath,
      subItems: [],
      emptyMessage: 'Раздел в разработке',
    },
    {
      id: 'apteka',
      label: 'Apteka',
      iconName: 'Pill',
      domain: products.apteka.domain,
      defaultPath: products.apteka.basePath,
      matchPrefix: products.apteka.basePath,
      subItems: [],
      emptyMessage: 'Раздел в разработке',
    },
    {
      id: 'users',
      label: 'Пользователи',
      iconName: 'Users',
      defaultPath: '/users',
      matchPrefix: '/users',
      subItems: [
        { label: 'Пользователи', path: '/users' },
        { label: 'Роли',             path: '/users/roles' },
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

function StandaloneSidebar({ productId }: { productId: ProductId }) {
  const location = useLocation()
  const product = products[productId]

  const items: StandaloneNavItem[] = product.sections.map((s) => ({
    label: s.label,
    path: `/${s.slug}`,
    iconName: s.iconName,
    end: s.slug !== 'orders',
  }))

  return (
    <aside className="flex h-screen w-[140px] shrink-0 flex-col bg-[#1C1917]">
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
                  title={item.label}
                  className="group flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all duration-150"
                >
                  <span
                    className={cn(
                      'flex h-[40px] w-[108px] shrink-0 items-center justify-center rounded-[120px] transition-all duration-150',
                      isActive
                        ? 'bg-white text-gray-900'
                        : 'text-[#6B7280] group-hover:text-stone-300'
                    )}
                  >
                    {renderIcon(item.iconName)}
                  </span>
                  <span
                    className={cn(
                      'text-center text-[16px] leading-tight',
                      isActive
                        ? 'font-semibold text-white'
                        : 'font-normal text-[#6B7280] group-hover:text-stone-300'
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-[#6B7280] py-[16px]">
        <p className="text-center text-[14px] text-[#6B7280]">v1.0.2</p>
      </div>
    </aside>
  )
}

const COLLAPSE_STORAGE_KEY = 'lekko-sidebar-collapsed'

function PortalSidebar() {
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

  // Sync expanded category with URL navigation (when user clicks links elsewhere).
  useEffect(() => {
    if (activeFromUrl && activeFromUrl.id !== expandedId) {
      setExpandedId(activeFromUrl.id)
    }
  }, [activeFromUrl, expandedId])

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const expanded = categories.find((c) => c.id === expandedId) ?? categories[0]

  function handleCategoryClick(category: PortalCategory) {
    setExpandedId(category.id)
    if (collapsed) setCollapsed(false)
    if (!location.pathname.startsWith(category.matchPrefix)) {
      navigate(category.defaultPath)
    }
  }

  return (
    <aside className="flex h-screen shrink-0">
      {/* Outer icon column */}
      <div className="flex w-[96px] shrink-0 flex-col bg-[#1C1917]">
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Раскрыть разделы' : 'Свернуть разделы'}
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
                    title={cat.label}
                    className="group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all duration-150"
                  >
                    <span
                      className={cn(
                        'flex h-[40px] w-[72px] shrink-0 items-center justify-center rounded-[120px] transition-all duration-150',
                        isOnRoute
                          ? 'bg-white text-gray-900'
                          : isExpanded
                          ? 'bg-white/10 text-white'
                          : 'text-[#6B7280] group-hover:text-stone-300'
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
                          : 'font-normal text-[#6B7280] group-hover:text-stone-300'
                      )}
                    >
                      {cat.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-[#6B7280] py-[16px]">
          <p className="text-center text-[12px] text-[#6B7280]">v1.0.2</p>
        </div>
      </div>

      {/* Expanded sub-items panel */}
      {collapsed ? null : (
        <div className="flex w-[200px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2 px-3">
          <span className="flex-1 text-[15px] font-semibold text-gray-900">{expanded.label}</span>
          {expanded.domain && (
            <a
              href={`https://${expanded.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Открыть ${expanded.domain}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Разделы
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {expanded.subItems.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">
              {expanded.emptyMessage ?? 'Нет разделов'}
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
                          ? 'bg-gray-100 font-medium text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )
                    }
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                    <span>{s.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>
        </div>
      )}
    </aside>
  )
}

export function Sidebar({ mode, productId }: SidebarProps) {
  if (mode === 'standalone' && productId) {
    return <StandaloneSidebar productId={productId} />
  }
  return <PortalSidebar />
}
