import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export function PortalLayout() {
  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-gray-50 dark:bg-[#090909]">
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
