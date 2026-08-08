import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSchool } from '@/hooks/useSchool'
import { SchoolTypeStep } from '@/components/onboarding/SchoolTypeStep'

export default function Onboarding() {
  const navigate = useNavigate()
  const { school, loading, refetch } = useSchool()

  useEffect(() => {
    if (!loading && school?.onboarding_completed) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, school, navigate])

  if (loading || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">
            Let's set up <span className="text-brand-gold">{school.name}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A few quick steps to get your school ready
          </p>
        </div>

        {school.onboarding_step === 'school_type' && (
          <SchoolTypeStep schoolId={school.id} onComplete={refetch} />
        )}
      </div>
    </div>
  )
}