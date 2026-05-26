import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import type { ProductId } from '@/config/mode'

interface StandaloneLayoutProps {
  productId: ProductId
}

export function StandaloneLayout({ productId }: StandaloneLayoutProps) {
  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-gray-50 dark:bg-[#090909]">
      <Sidebar mode="standalone" productId={productId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        {/* Spacer для мобильного tab bar — убран вместе с самим tab bar в Sidebar. */}
      </div>
    </div>
  )
}
