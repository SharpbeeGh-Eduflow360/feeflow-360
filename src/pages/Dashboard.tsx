import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SchoolInfo {
  name: string
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [school, setSchool] = useState<SchoolInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSchool() {
      const { data, error } = await supabase
        .from('schools')
        .select('name')
        .single()

      if (!error && data) {
        setSchool(data)
      }
      setLoading(false)
    }

    loadSchool()
  }, [])

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">School</p>
              <p className="font-medium">
                {loading ? 'Loading...' : school?.name ?? 'No school found'}
              </p>
            </div>

            <Button variant="outline" onClick={signOut} className="w-fit">
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}