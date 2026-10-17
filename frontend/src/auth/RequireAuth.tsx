import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/app/LoadingState'
import type { Role } from '@/api/schemas'
import { useAuth } from './AuthProvider'

/** Sends logged-out users to /login and back again afterwards. With `roles`, others are refused. */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState message="Checking your session" className="min-h-screen" />
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/home" replace />
  return <Outlet />
}
