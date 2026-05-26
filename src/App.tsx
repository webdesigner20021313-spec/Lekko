import { Routes, Route, Navigate } from 'react-router-dom'
import { detectMode } from '@/config/mode'
import { products } from '@/config/products'
import { PortalLayout } from '@/layouts/PortalLayout'
import { StandaloneLayout } from '@/layouts/StandaloneLayout'
import { PrivateRoute } from '@/shared/auth/PrivateRoute'
import { LoginPage } from '@/shared/auth/LoginPage'
import { Dashboard } from '@/pages/Dashboard'
import { HomeRouter } from '@/pages/MobileHome/HomeRouter'
import { UsersPage } from '@/pages/Users/UsersPage'
import { RolesPage } from '@/pages/Users/RolesPage'
import { ProfilePage } from '@/pages/Profile/ProfilePage'
import { megapriceRoutes } from '@/products/megaprice/routes'

function App() {
  const appMode = detectMode()

  if (appMode.mode === 'portal') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <PrivateRoute>
              <PortalLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomeRouter scope="all" desktopFallback={<Dashboard />} />} />
          <Route path="megaprice">{megapriceRoutes}</Route>
          <Route
            path="analytic"
            element={
              <div className="flex h-full items-center justify-center p-8 text-gray-500">
                Analytic — в разработке
              </div>
            }
          />
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
      <Route
        element={
          <PrivateRoute>
            <StandaloneLayout productId={productId} />
          </PrivateRoute>
        }
      >
        {productId === 'megaprice' ? (
          megapriceRoutes
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
        <Route path="*" element={<Navigate to={fallbackPath} replace />} />
      </Route>
    </Routes>
  )
}

export default App
