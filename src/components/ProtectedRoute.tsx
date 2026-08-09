import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useSchool } from '@/hooks/useSchool'
import { isPastEndDate } from '@/lib/date-helpers'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { school, loading: schoolLoading } = useSchool()
  const location = useLocation()
  const [termExpired, setTermExpired] = useState(false)
  const [checkingTerm, setCheckingTerm] = useState(true)

  useEffect(() => {
    async function checkTerm() {
      if (!school || !school.onboarding_completed) {
        setCheckingTerm(false)
        return
      }

      const { data: schoolData } = await supabase
        .from('schools')
        .select('current_term_id')
        .eq('id', school.id)
        .single()

      if (!schoolData?.current_term_id) {
        setTermExpired(true)
        setCheckingTerm(false)
        return
      }

      const { data: termData } = await supabase
        .from('terms')
        .select('end_date')
        .eq('id', schoolData.current_term_id)
        .single()

      if (!termData?.end_date) {
        setTermExpired(true)
      } else {
        setTermExpired(isPastEndDate(termData.end_date))
      }

      setCheckingTerm(false)
    }

    checkTerm()
  }, [school])

  if (authLoading || (user && schoolLoading) || (user && checkingTerm)) {
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

  const isSettingsPage = location.pathname === '/settings'

  if (school?.onboarding_completed && termExpired && !isSettingsPage) {
    return <Navigate to="/term-expired" replace />
  }

  return <>{children}</>
}