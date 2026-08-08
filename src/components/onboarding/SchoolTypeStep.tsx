import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { School, GraduationCap, BookOpen, Layers, Settings } from 'lucide-react'

const schoolTypes = [
  { value: 'preschool', label: 'Preschool', description: 'Nursery and Kindergarten', icon: School },
  { value: 'primary', label: 'Primary', description: 'Basic 1–6', icon: BookOpen },
  { value: 'jhs', label: 'JHS', description: 'Basic 7–9', icon: GraduationCap },
  { value: 'combined', label: 'Combined School', description: 'Nursery through Basic 9, or another combination', icon: Layers },
  { value: 'custom', label: 'Custom', description: 'Create your own structure', icon: Settings },
]

interface Props {
  schoolId: string
  onComplete: () => void
}

export function SchoolTypeStep({ schoolId, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('schools')
      .update({
        school_type: selected,
        onboarding_step: 'academic_year',
      })
      .eq('id', schoolId)

    setLoading(false)

    if (error) {
      setError(error.message)
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
          <h2 className="text-lg font-semibold">What type of school do you run?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This helps us set up the right levels for you.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {schoolTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selected === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelected(type.value)}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-brand-gold' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="mt-6 w-full bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}