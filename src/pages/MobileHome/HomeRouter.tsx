import { useEffect, useState, type ReactElement } from 'react'
import { MobileHome } from './MobileHome'
import type { ProductId } from '@/config/mode'

/**
 * Index-роут: на мобиле — карточная главная (MobileHome),
 * на десктопе — переданный desktopFallback.
 */
export function HomeRouter({
  desktopFallback,
  scope,
}: {
  desktopFallback: ReactElement
  scope: 'all' | ProductId
}) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (isDesktop) return desktopFallback
  return <MobileHome scope={scope} />
}
