import { Navigate, Route } from 'react-router-dom'
import { PurchasePage } from '@/products/megaprice/pages/purchase/PurchasePage'
import { OrderHistoryPage } from '@/products/megaprice/pages/orders/OrderHistoryPage'
import { OrderDetailPage } from '@/products/megaprice/pages/orders/OrderDetailPage'
import { CartPage } from '@/products/megaprice/pages/cart/CartPage'
import { NeedPage } from '@/products/megaprice/pages/need/NeedPage'
import { WholesalersPage } from '@/products/megaprice/pages/wholesalers/WholesalersPage'
import { HomeRouter } from '@/pages/MobileHome/HomeRouter'

/**
 * Роуты разделов Megaprice. Используются в standalone (под `/`)
 * и в portal (под `/megaprice`). Index-роут на мобиле показывает
 * сетку разделов, на десктопе — редирект на первый раздел.
 */
export const megapriceRoutes = (
  <>
    <Route
      index
      element={<HomeRouter scope="megaprice" desktopFallback={<Navigate to="purchase" replace />} />}
    />
    <Route path="purchase" element={<PurchasePage />} />
    <Route path="need" element={<NeedPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="orders">
      <Route index element={<OrderHistoryPage />} />
      <Route path=":id" element={<OrderDetailPage />} />
    </Route>
    <Route path="wholesalers" element={<WholesalersPage />} />
  </>
)
