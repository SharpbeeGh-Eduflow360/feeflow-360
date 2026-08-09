import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TermExpired() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-10 pb-8 text-center">
          <AlertTriangle className="h-12 w-12 text-brand-gold" />
          <div>
            <h1 className="text-xl font-semibold">Your current term has ended</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The term you had set as current has passed its end date. Set a
              new current term or extend the existing one before continuing.
            </p>
          </div>

          <Button
            onClick={() => navigate('/settings')}
            className="mt-2 w-full bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            Go to Academic Years settings
          </Button>

          <Button variant="ghost" onClick={signOut} className="text-sm text-muted-foreground">
            Log out instead
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}