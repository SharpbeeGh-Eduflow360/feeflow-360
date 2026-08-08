import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSchool } from '@/hooks/useSchool'
import { supabase } from '@/lib/supabase'
import { SchoolTypeStep } from '@/components/onboarding/SchoolTypeStep'
import { AcademicYearStep } from '@/components/onboarding/AcademicYearStep'
import { TermsStep } from '@/components/onboarding/TermsStep'
import { CompleteStep } from '@/components/onboarding/CompleteStep'

export default function Onboarding() {
  const navigate = useNavigate()
  const { school, loading, refetch } = useSchool()
  const [academicYearId, setAcademicYearId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && school?.onboarding_completed) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, school, navigate])

  useEffect(() => {
    if (school?.onboarding_step === 'terms') {
      supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', school.id)
        .single()
        .then(({ data }) => {
          if (data) setAcademicYearId(data.id)
        })
    }
  }, [school])

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

        {school.onboarding_step === 'academic_year' && (
          <AcademicYearStep schoolId={school.id} onComplete={refetch} />
        )}

        {school.onboarding_step === 'terms' && academicYearId && (
          <TermsStep
            schoolId={school.id}
            academicYearId={academicYearId}
            onComplete={refetch}
          />
        )}
        {school.onboarding_step === 'complete' && (
  <CompleteStep schoolId={school.id} />
)}
      </div>
    </div>
  )
}