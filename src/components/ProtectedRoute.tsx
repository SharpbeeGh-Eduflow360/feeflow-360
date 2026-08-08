import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useSchool } from '@/hooks/useSchool'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { school, loading: schoolLoading } = useSchool()

  if (authLoading || (user && schoolLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (school && !school.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}