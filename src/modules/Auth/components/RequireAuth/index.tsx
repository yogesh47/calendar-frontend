import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LOGIN_ROUTE } from '../../constants'
import type { Role, Session } from '../../types'

interface RequireAuthProps {
  session: Session | null
  isChecking: boolean
  role?: Role
  children: ReactNode
}

const RequireAuth = ({ session, isChecking, role, children }: RequireAuthProps) => {
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!session) return <Navigate to={LOGIN_ROUTE} replace />

  if (role && session.user.role !== role) {
    return <Navigate to={`/${session.user.role}/calendar`} replace />
  }

  return <>{children}</>
}

export default RequireAuth
