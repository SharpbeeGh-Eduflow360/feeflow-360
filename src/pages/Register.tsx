import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

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
      options: { data: { full_name: fullName } },
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

  return (
    <div className="flex min-h-screen">
      {/* Left: brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-brand-navy p-12 lg:flex">
        <Link to="/" className="text-lg font-bold text-white">
          FeeFlow<span className="text-brand-gold">-360</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-2xl font-semibold leading-snug text-white">
            Join schools already replacing spreadsheets and exercise books
            with one reliable financial system.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            15-day free trial · No credit card required
          </p>
        </motion.div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} FeeFlow-360 by SharpbeeGh
        </p>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <Link to="/" className="mb-8 text-lg font-bold text-brand-navy dark:text-white lg:hidden">
          FeeFlow<span className="text-brand-gold">-360</span>
        </Link>

        <div className="w-full max-w-sm">
          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardContent className="pt-6">
              {/* Step indicator */}
              <div className="mb-6 flex items-center gap-2">
                <div className={`h-1.5 flex-1 rounded-full ${step === 'account' || step === 'school' ? 'bg-brand-gold' : 'bg-muted'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${step === 'school' ? 'bg-brand-gold' : 'bg-muted'}`} />
              </div>

              <AnimatePresence mode="wait">
                {step === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Step 1 of 2 — Your details
                    </p>

                    <form onSubmit={handleCreateAccount} className="mt-6 flex flex-col gap-4">
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

                      <Button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-brand-navy text-white hover:bg-brand-navy-light"
                      >
                        {loading ? 'Creating account...' : 'Continue'}
                        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>

                      <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-brand-gold hover:underline">
                          Sign in
                        </Link>
                      </p>
                    </form>
                  </motion.div>
                )}

                {step === 'school' && (
                  <motion.div
                    key="school"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-2xl font-bold">Your school</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Step 2 of 2 — School details
                    </p>

                    <form onSubmit={handleCreateSchool} className="mt-6 flex flex-col gap-4">
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

                      <Button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-brand-navy text-white hover:bg-brand-navy-light"
                      >
                        {loading ? 'Setting up...' : 'Finish setup'}
                        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}