import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useOrderNotifications } from '@/shared/notifications/useOrderNotifications'

export function PortalLayout() {
  useOrderNotifications()
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#111111]">
      <Sidebar mode="portal" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
