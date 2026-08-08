import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface Props {
  schoolId: string
  academicYearId: string
  onComplete: () => void
}

const defaultTerms = ['First Term', 'Second Term', 'Third Term']

export function TermsStep({ schoolId, academicYearId, onComplete }: Props) {
  const [terms, setTerms] = useState<string[]>(defaultTerms)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateTerm(index: number, value: string) {
    setTerms((prev) => prev.map((t, i) => (i === index ? value : t)))
  }

  function addTerm() {
    setTerms((prev) => [...prev, ''])
  }

  function removeTerm(index: number) {
    setTerms((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    setError(null)
    const cleanTerms = terms.map((t) => t.trim()).filter(Boolean)

    if (cleanTerms.length === 0) {
      setError('Add at least one term.')
      return
    }

    setLoading(true)

    const rows = cleanTerms.map((name, index) => ({
      school_id: schoolId,
      academic_year_id: academicYearId,
      name,
      position: index + 1,
    }))

    const { error: insertError } = await supabase.from('terms').insert(rows)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('schools')
      .update({ onboarding_step: 'complete' })
      .eq('id', schoolId)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    onComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold">Set your terms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We've pre-filled the standard three terms — edit, remove, or add your own.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {terms.map((term, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={term}
                  onChange={(e) => updateTerm(index, e.target.value)}
                  placeholder={`Term ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeTerm(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remove term"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addTerm}
              className="w-fit"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add term
            </Button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}