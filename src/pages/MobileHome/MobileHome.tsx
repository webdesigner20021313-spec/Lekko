import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShoppingCart, ClipboardList, Building2, Store, TrendingUp,
  Users, BarChart3, Pill, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { mp } from '@/products/megaprice/utils/path'
import { detectMode } from '@/config/mode'
import { usePurchaseCart } from '@/products/megaprice/pages/purchase/hooks/usePurchaseCart'
import banner1 from '@/assets/banners/banner-default.jpg'
import banner2 from '@/assets/banners/banner-default2.jpg'
import banner3 from '@/assets/banners/banner-default3.jpg'
import { useOrdersStore } from '@/products/megaprice/stores/useOrdersStore'
import { mockWholesalers } from '@/products/megaprice/mocks/wholesalers.mocks'
import { mockDistributors } from '@/products/megaprice/mocks/purchase.mocks'
import { mockNeedItems } from '@/products/megaprice/mocks/need.mocks'
import type { ProductId } from '@/config/mode'

/**
 * Главная мобильная страница.
 *
 * Геометрия карточек одинаковая, визуальная иерархия идёт через:
 *  - акценты цвета (амбер/синий/изумруд = срочность/состояние, не «бренд раздела»)
 *  - крупные числа в активных карточках
 *  - градиент-подложку и кольцо-glow вокруг иконки у активных
 *  - lifelike детали: pulse-точка у алерта, decorative-«пятно» в углу
 *
 * Профиль-блок — hero-зона с градиентом, аватаром и приветствием по времени суток.
 */

interface MobileHomeProps {
  scope: 'all' | ProductId
}

type Accent = 'amber' | 'blue' | 'emerald' | 'violet' | 'neutral' | 'muted'

interface Card {
  to: string
  icon: LucideIcon
  label: string
  value?: number | string
  hint?: string
  badge?: string
  accent: Accent
  /** Pulse-точка у иконки (для алертов). */
  pulse?: boolean
  disabled?: boolean
}

interface Group {
  key: string
  title: string
  subtitle?: string
  cards: Card[]
}

export function MobileHome({ scope }: MobileHomeProps) {
  const { t } = useTranslation()
  const appMode = detectMode()

  const cartItems = usePurchaseCart((s) => s.items)
  const orders = useOrdersStore((s) => s.orders)
  const cartCount = cartItems.length
  const newOrders = orders.filter((o) => o.status === 'new').length
  const activeOrders = orders.filter((o) => o.status === 'new' || o.status === 'modified').length
  const oosCount = mockNeedItems.filter((i) => i.status === 'oos').length
  const distributorsCount = mockWholesalers.length
  const todayIso = new Date().toISOString().slice(0, 10)
  const newPricesToday = mockDistributors.filter((d) => d.lastPriceDate === todayIso).length

  const groups: Group[] = []

  groups.push({
    key: 'megaprice',
    title: t('home_group_megaprice'),
    subtitle: t('home_group_megaprice_sub'),
    cards: [
      // Порядок по важности: Прайс-лист (основной) → Корзинка → Потребность → Заказы → Дистрибуторы
      {
        to: mp('/purchase'),
        icon: Store,
        label: t('nav_purchase'),
        value: newPricesToday > 0 ? newPricesToday : undefined,
        hint: newPricesToday > 0 ? t('home_purchase_new_today', { n: newPricesToday }) : t('home_purchase_hint'),
        accent: 'violet',
      },
      {
        to: mp('/cart'),
        icon: ShoppingCart,
        label: t('nav_cart'),
        value: cartCount,
        hint: cartCount > 0 ? t('home_cart_active') : t('home_cart_empty'),
        accent: cartCount > 0 ? 'emerald' : 'neutral',
      },
      {
        to: mp('/need'),
        icon: TrendingUp,
        label: t('nav_need'),
        value: oosCount > 0 ? oosCount : undefined,
        hint: oosCount > 0 ? t('home_need_oos_hint') : t('home_need_ok'),
        accent: oosCount > 0 ? 'amber' : 'neutral',
        pulse: oosCount > 0,
      },
      {
        to: mp('/orders'),
        icon: ClipboardList,
        label: t('nav_orders'),
        value: activeOrders,
        hint: newOrders > 0 ? t('home_orders_new', { n: newOrders }) : t('home_orders_no_new'),
        accent: newOrders > 0 ? 'blue' : 'neutral',
      },
      {
        to: mp('/wholesalers'),
        icon: Building2,
        label: t('nav_wholesalers'),
        value: distributorsCount,
        hint: t('home_wholesalers_partners'),
        accent: 'neutral',
      },
    ],
  })

  // В portal-режиме всегда показываем все группы (не зависит от scope) —
  // иначе на /megaprice пользователь видит только этот продукт.
  if (scope === 'all' || appMode.mode === 'portal') {
    groups.push({
      key: 'products',
      title: t('home_group_products'),
      subtitle: t('home_group_products_sub'),
      cards: [
        {
          to: '/apteka',
          icon: Pill,
          label: t('home_apteka_card'),
          badge: t('home_in_dev'),
          accent: 'muted',
          disabled: true,
        },
        {
          to: '/analytic',
          icon: BarChart3,
          label: t('home_analytic_card'),
          badge: t('home_in_dev'),
          accent: 'muted',
          disabled: true,
        },
      ],
    })

    groups.push({
      key: 'admin',
      title: t('home_group_admin'),
      subtitle: t('home_group_admin_sub'),
      cards: [
        {
          to: '/users',
          icon: Users,
          label: t('home_users_card'),
          hint: t('home_users_hint'),
          accent: 'neutral',
        },
        {
          to: '/users/roles',
          icon: ShieldCheck,
          label: t('home_roles_card'),
          hint: t('home_roles_hint'),
          accent: 'neutral',
        },
      ],
    })
  }

  return (
    <div className="md:hidden h-full overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]">
      <AdBanner />
      <div className="px-4 pt-6 pb-10 space-y-6">

        {groups.map((group) => (
          <SectionGroup key={group.key} group={group} />
        ))}

      </div>
    </div>
  )
}

// ─── Ad banner ────────────────────────────────────────────────────────────

const BANNERS = [banner1, banner2, banner3]

function AdBanner() {
  const total = BANNERS.length
  // Бесконечный скролл: клонируем последний слайд в начало и первый — в конец.
  // Рендерим [clone-last, ...BANNERS, clone-first]; реальные индексы — 1..total.
  const slides = [BANNERS[total - 1], ...BANNERS, BANNERS[0]]

  const scrollerRef = useRef<HTMLDivElement>(null)
  const scrollEndTimer = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Шаг скролла = ширина одной карточки + gap. Считаем по реальной разметке.
  const getItemWidth = () => {
    const el = scrollerRef.current
    if (!el || el.children.length < 2) return 0
    const first = el.children[0] as HTMLElement
    const second = el.children[1] as HTMLElement
    return second.offsetLeft - first.offsetLeft
  }

  // Старт: позиционируем на первый реальный слайд (index 1 в track'е) без анимации.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = scrollerRef.current
      const itemW = getItemWidth()
      if (!el || itemW === 0) return
      el.scrollLeft = itemW * 1
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const itemW = getItemWidth()
    if (itemW === 0) return

    const i = Math.round(el.scrollLeft / itemW)
    const real = ((i - 1) % total + total) % total
    if (real !== activeIndex) setActiveIndex(real)

    // После остановки скролла — если оказались на клоне, мгновенно прыгаем на реальный слайд.
    if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = window.setTimeout(() => {
      if (i === 0) {
        el.scrollTo({ left: total * itemW, behavior: 'instant' as ScrollBehavior })
      } else if (i === total + 1) {
        el.scrollTo({ left: 1 * itemW, behavior: 'instant' as ScrollBehavior })
      }
    }, 120)
  }

  const goTo = (real: number) => {
    const el = scrollerRef.current
    if (!el) return
    const itemW = getItemWidth()
    el.scrollTo({ left: (real + 1) * itemW, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((src, i) => (
          <div
            key={i}
            className="relative aspect-[11/6] w-screen shrink-0 snap-center overflow-hidden"
          >
            <img
              src={src}
              alt={`Реклама ${i}`}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dots — поверх баннера */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Баннер ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Section group ────────────────────────────────────────────────────────

function SectionGroup({ group }: { group: Group }) {
  if (group.cards.length === 0) return null
  return (
    <section>
      <header className="mb-2 flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-gray-50 leading-none">
            {group.title}
          </h2>
          {group.subtitle && (
            <p className="mt-1 text-[12px] text-gray-500 dark:text-[#929292] leading-snug">
              {group.subtitle}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-gray-400 dark:text-[#5e5e5e]">
          {group.cards.length}
        </span>
      </header>
      <div className="grid grid-cols-2 gap-2">
        {group.cards.map((card) => (
          <CardView key={card.to} card={card} />
        ))}
      </div>
    </section>
  )
}

// ─── Card view ────────────────────────────────────────────────────────────

const ACCENT: Record<Accent, {
  iconBg: string
  iconText: string
  iconRing: string
  bgOverlay: string
  valueText: string
  edge: string
  blob: string
}> = {
  amber: {
    iconBg:    'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/25 dark:to-amber-500/10',
    iconText:  'text-amber-600 dark:text-amber-300',
    iconRing:  'ring-1 ring-amber-200/80 dark:ring-amber-500/30',
    bgOverlay: 'bg-gradient-to-br from-amber-50/60 via-white to-white dark:from-amber-500/[0.06] dark:via-[#171717] dark:to-[#171717]',
    valueText: 'text-amber-600 dark:text-amber-300',
    edge:      'border-amber-200/60 dark:border-amber-500/20',
    blob:      'from-amber-200/40 to-orange-200/0 dark:from-amber-500/15',
  },
  blue: {
    iconBg:    'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/25 dark:to-blue-500/10',
    iconText:  'text-blue-600 dark:text-blue-300',
    iconRing:  'ring-1 ring-blue-200/80 dark:ring-blue-500/30',
    bgOverlay: 'bg-gradient-to-br from-blue-50/60 via-white to-white dark:from-blue-500/[0.06] dark:via-[#171717] dark:to-[#171717]',
    valueText: 'text-blue-600 dark:text-blue-300',
    edge:      'border-blue-200/60 dark:border-blue-500/20',
    blob:      'from-blue-200/40 to-violet-200/0 dark:from-blue-500/15',
  },
  emerald: {
    iconBg:    'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/25 dark:to-emerald-500/10',
    iconText:  'text-emerald-600 dark:text-emerald-300',
    iconRing:  'ring-1 ring-emerald-200/80 dark:ring-emerald-500/30',
    bgOverlay: 'bg-gradient-to-br from-emerald-50/60 via-white to-white dark:from-emerald-500/[0.06] dark:via-[#171717] dark:to-[#171717]',
    valueText: 'text-emerald-600 dark:text-emerald-300',
    edge:      'border-emerald-200/60 dark:border-emerald-500/20',
    blob:      'from-emerald-200/40 to-teal-200/0 dark:from-emerald-500/15',
  },
  violet: {
    iconBg:    'bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-500/25 dark:to-violet-500/10',
    iconText:  'text-violet-600 dark:text-violet-300',
    iconRing:  'ring-1 ring-violet-200/80 dark:ring-violet-500/30',
    bgOverlay: 'bg-gradient-to-br from-violet-50/60 via-white to-white dark:from-violet-500/[0.06] dark:via-[#171717] dark:to-[#171717]',
    valueText: 'text-violet-600 dark:text-violet-300',
    edge:      'border-violet-200/60 dark:border-violet-500/20',
    blob:      'from-violet-200/40 to-fuchsia-200/0 dark:from-violet-500/15',
  },
  neutral: {
    iconBg:    'bg-gray-100 dark:bg-[#222222]',
    iconText:  'text-gray-600 dark:text-gray-300',
    iconRing:  '',
    bgOverlay: 'bg-white dark:bg-[#171717]',
    valueText: 'text-gray-900 dark:text-gray-50',
    edge:      'border-gray-200 dark:border-[#262626]',
    blob:      'from-gray-200/0 to-gray-200/0',
  },
  muted: {
    iconBg:    'bg-gray-100 dark:bg-[#1f1f1f]',
    iconText:  'text-gray-400 dark:text-[#5e5e5e]',
    iconRing:  '',
    bgOverlay: 'bg-gray-50/50 dark:bg-[#141414]',
    valueText: 'text-gray-300 dark:text-[#3a3a3a]',
    edge:      'border-gray-100 dark:border-[#1f1f1f]',
    blob:      'from-gray-200/0 to-gray-200/0',
  },
}

function CardView({ card }: { card: Card }) {
  const Icon = card.icon
  const a = ACCENT[card.accent]
  const Wrapper = card.disabled ? StaticWrapper : LinkWrapper
  const isAccent = card.accent !== 'neutral' && card.accent !== 'muted'

  return (
    <Wrapper to={card.to}>
      <div
        className={cn(
          'group relative flex aspect-[6/5] flex-col overflow-hidden rounded-2xl border p-3 shadow-[0_2px_6px_-3px_rgba(15,23,42,0.06)] transition-all',
          a.bgOverlay,
          a.edge,
          !card.disabled && 'active:scale-[0.97] active:shadow-none',
        )}
      >
        {/* Decorative gradient blob */}
        {isAccent && (
          <div
            className={cn(
              'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br blur-xl',
              a.blob,
            )}
          />
        )}

        {/* Top: иконка + value/badge */}
        <div className="relative flex items-start justify-between">
          <div className={cn('relative flex h-10 w-10 items-center justify-center rounded-xl', a.iconBg, a.iconRing)}>
            <Icon className={cn('h-[19px] w-[19px]', a.iconText)} strokeWidth={2.2} />
            {card.pulse && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#171717]" />
              </span>
            )}
          </div>
          {card.value !== undefined && (
            <span className={cn('text-[28px] font-extrabold leading-none tabular-nums tracking-tight', a.valueText)}>
              {card.value}
            </span>
          )}
          {card.badge && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200/60 dark:bg-[#222222] dark:text-[#929292] dark:ring-[#2a2a2a]">
              {card.badge}
            </span>
          )}
        </div>

        {/* Bottom: label + hint */}
        <div className="relative mt-auto">
          <p className={cn(
            'text-[14px] font-semibold leading-tight tracking-tight',
            card.disabled
              ? 'text-gray-400 dark:text-[#5e5e5e]'
              : 'text-gray-900 dark:text-gray-50',
          )}>
            {card.label}
          </p>
          {card.hint && (
            <p className={cn(
              'mt-1 text-[10.5px] leading-snug line-clamp-2',
              card.disabled
                ? 'text-gray-300 dark:text-[#444444]'
                : 'text-gray-500 dark:text-[#929292]',
            )}>
              {card.hint}
            </p>
          )}
        </div>
      </div>
    </Wrapper>
  )
}

function LinkWrapper({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="block">{children}</Link>
}

function StaticWrapper({ children }: { to: string; children: React.ReactNode }) {
  return <div className="block cursor-not-allowed select-none">{children}</div>
}
