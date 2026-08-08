import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface School {
  id: string
  name: string
  school_type: string | null
  currency: string
  onboarding_step: string
  onboarding_completed: boolean
}

export function useSchool() {
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)

  async function refetch() {
    setLoading(true)
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, school_type, currency, onboarding_step, onboarding_completed')
      .single()

    if (!error && data) {
      setSchool(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    refetch()
  }, [])

  return { school, loading, refetch }
}