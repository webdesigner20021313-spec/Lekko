import { useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { detectMode } from '@/config/mode'
import { products } from '@/config/products'
import { PortalLayout } from '@/layouts/PortalLayout'
import { StandaloneLayout } from '@/layouts/StandaloneLayout'
import { PrivateRoute } from '@/shared/auth/PrivateRoute'
import { LoginPage } from '@/shared/auth/LoginPage'
import { Dashboard } from '@/pages/Dashboard'
import { UsersPage } from '@/pages/Users/UsersPage'
import { RolesPage } from '@/pages/Users/RolesPage'
import { analyticRoutes } from '@/pages/Analytic/routes'
import { ProfilePage } from '@/pages/ProfilePage'
import { megapriceRoutes } from '@/products/megaprice/routes'

function App() {
  // Кэшируем один раз на сессию: detectMode читает ?mode= (теряется при SPA-навигации),
  // поэтому без кэша режим бы слетал на дефолт при переходах.
  const appMode = useMemo(() => detectMode(), [])

  if (appMode.mode === 'portal') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Старый путь кабинета дистра — редирект на продукт «Аналитика». */}
        <Route path="/distributor-portal" element={<Navigate to="/analytic" replace />} />
        <Route
          element={
            <PrivateRoute>
              <PortalLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="megaprice">{megapriceRoutes}</Route>
          {/* «Аналитика» — разделы дистра ВНУТРИ портала (как megaprice). */}
          <Route path="analytic">{analyticRoutes}</Route>
          <Route
            path="apteka"
            element={
              <div className="flex h-full items-center justify-center p-8 text-gray-500">
                Apteka — в разработке
              </div>
            }
          />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/roles" element={<RolesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* /settings объединён с /profile (вкладка «Аптека») — редирект для старых ссылок */}
          <Route path="settings" element={<Navigate to="/profile" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    )
  }

  const productId = appMode.productId!
  const product = products[productId]
  const fallbackPath = product.sections[0]
    ? `/${product.sections[0].slug}`
    : '/'

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/distributor-portal" element={<Navigate to="/analytic" replace />} />
      <Route
        element={
          <PrivateRoute>
            <StandaloneLayout productId={productId} />
          </PrivateRoute>
        }
      >
        {productId === 'megaprice' ? (
          megapriceRoutes
        ) : productId === 'analytic' ? (
          analyticRoutes
        ) : (
          <Route
            index
            element={
              <div className="flex h-full items-center justify-center p-8 text-gray-500">
                {product.name} — в разработке
              </div>
            }
          />
        )}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to={fallbackPath} replace />} />
      </Route>
    </Routes>
  )
}

export default App
