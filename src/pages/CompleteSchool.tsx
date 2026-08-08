import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function CompleteSchool() {
  const navigate = useNavigate()
  const [schoolName, setSchoolName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreateSchool(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: rpcError } = await supabase.rpc('create_school_and_link', {
      school_name: schoolName,
    })

    setLoading(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Complete your setup</CardTitle>
          <CardDescription>Just one more step — your school</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSchool} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="schoolName">School name</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Setting up...' : 'Finish setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}