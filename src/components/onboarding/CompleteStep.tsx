import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  schoolId: string
}

export function CompleteStep({ schoolId }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleFinish() {
    setLoading(true)

    await supabase
      .from('schools')
      .update({ onboarding_completed: true })
      .eq('id', schoolId)

    navigate('/dashboard', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-10 pb-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-brand-gold" />
          <div>
            <h2 className="text-xl font-semibold">You're all set</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your school is ready. You can always fine-tune levels, classes,
              and payment methods later from Settings.
            </p>
          </div>

          <Button
            onClick={handleFinish}
            disabled={loading}
            className="mt-4 w-full bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            {loading ? 'Finishing up...' : 'Go to Dashboard'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}