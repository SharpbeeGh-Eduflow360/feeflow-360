import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

type Step = 'account' | 'school'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('account')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [schoolName, setSchoolName] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setStep('school')
  }

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

    // 1. Create the school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({ name: schoolName })
      .select()
      .single()

    if (schoolError) {
      setError(schoolError.message)
      setLoading(false)
      return
    }

    // 2. Link the profile to this school
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ school_id: school.id })
      .eq('id', user.id)

    setLoading(false)

    if (profileError) {
      setError(profileError.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        {step === 'account' && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>Step 1 of 2 — Your details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Continue'}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </>
        )}

        {step === 'school' && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Your school</CardTitle>
              <CardDescription>Step 2 of 2 — School details</CardDescription>
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
          </>
        )}
      </Card>
    </div>
  )
}