import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/shared/auth/useAuthStore'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, hasBootstrapped, bootstrap } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!hasBootstrapped) void bootstrap()
  }, [hasBootstrapped, bootstrap])

  if (!hasBootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
