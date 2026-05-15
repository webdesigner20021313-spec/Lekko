import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useOrderNotifications } from '@/shared/notifications/useOrderNotifications'
import type { ProductId } from '@/config/mode'

interface StandaloneLayoutProps {
  productId: ProductId
}

export function StandaloneLayout({ productId }: StandaloneLayoutProps) {
  useOrderNotifications()
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#111111]">
      <Sidebar mode="standalone" productId={productId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        {/* Spacer so fixed mobile tab bar (incl. iOS safe-area) doesn't cover content */}
        <div className="h-16 shrink-0 pb-safe md:hidden" />
      </div>
    </div>
  )
}
