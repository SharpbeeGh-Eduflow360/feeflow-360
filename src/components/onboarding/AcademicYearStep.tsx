import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  schoolId: string
  onComplete: () => void
}

// Suggests the current Ghanaian academic year based on today's date
function suggestedYearName() {
  const now = new Date()
  const year = now.getFullYear()
  // Academic years typically start around September in Ghana
  const startYear = now.getMonth() >= 7 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

export function AcademicYearStep({ schoolId, onComplete }: Props) {
  const [name, setName] = useState(suggestedYearName())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: insertError } = await supabase
      .from('academic_years')
      .insert({
        school_id: schoolId,
        name,
        start_date: startDate || null,
        end_date: endDate || null,
        status: 'active',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('schools')
      .update({ onboarding_step: 'terms' })
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
          <h2 className="text-lg font-semibold">Set your academic year</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You can add more academic years later.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="yearName">Academic year name</Label>
              <Input
                id="yearName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="startDate">Start date (optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="endDate">End date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 bg-brand-navy text-white hover:bg-brand-navy-light"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}