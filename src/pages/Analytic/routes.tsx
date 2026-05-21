import { Navigate, Outlet, Route, useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import analyticLogo from '@/assets/logos/analytic-logo.svg'
import { useDistributorMe, type DistributorMe } from '@/pages/DistributorPortal/api/hooks'
import { CabinetSection } from './CabinetSection'
import { PharmaciesSection } from './PharmaciesSection'
import { AnalyticsSection } from './AnalyticsSection'

// Разделы продукта «Аналитика» — монтируются ВНУТРИ платформенного layout
// (PortalLayout / StandaloneLayout), 1:1 как megapriceRoutes. Поэтому при клике
// в сайдбаре меняется только контент, а каркас портала остаётся.

interface AnalyticCtx {
  distributorIds: number[]
}

/**
 * Гейт продукта: контент доступен только дистрибьютору (своя cookie-сессия).
 * Обычный пользователь видит заглушку «в разработке». distributorIds прокидываем
 * вложенным разделам через Outlet context.
 */
function AnalyticFrame() {
  const me = useDistributorMe()
  const location = useLocation()
  const meData = me.data as { distributor?: DistributorMe; distributorIds?: number[] } | undefined
  const distributor = meData?.distributor ?? null
  const distributorIds = meData?.distributorIds ?? (distributor ? [distributor.id] : [])

  if (me.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <p className="text-sm text-gray-400">Загрузка…</p>
      </div>
    )
  }
  if (!distributor) return <AnalyticComingSoon />

  return (
    // overflow-y-scroll (а не auto) — скроллбар ВСЕГДА на месте, контент не
    // дёргается по горизонтали при появлении/исчезновении скролла между разделами.
    <div className="scroll-stable h-full overflow-y-scroll bg-gray-50 dark:bg-[#0a0a0a]">
      {/* key=pathname → плавный fade при переходе (без движения = без «дёрганья»). */}
      <div key={location.pathname} className="animate-fade-in">
        <Outlet context={{ distributorIds } satisfies AnalyticCtx} />
      </div>
    </div>
  )
}

function AnalyticsSectionRoute() {
  const { distributorIds } = useOutletContext<AnalyticCtx>()
  return <AnalyticsSection distributorIds={distributorIds} />
}

export const analyticRoutes = (
  <Route element={<AnalyticFrame />}>
    <Route index element={<Navigate to="cabinet" replace />} />
    <Route path="cabinet" element={<CabinetSection />} />
    <Route path="pharmacies" element={<PharmaciesSection />} />
    <Route path="analytics" element={<AnalyticsSectionRoute />} />
    <Route path="*" element={<Navigate to="cabinet" replace />} />
  </Route>
)

// Заглушка продукта «Аналитика» для обычного пользователя (не дистрибьютора).
export function AnalyticComingSoon() {
  const navigate = useNavigate()
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <img src={analyticLogo} alt="Аналитика" className="h-10 w-auto opacity-40 grayscale" />
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Аналитика — в разработке</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Раздел скоро появится.</p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-[#222222]"
      >
        На главную
      </button>
    </div>
  )
}
