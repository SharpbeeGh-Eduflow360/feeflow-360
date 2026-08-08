import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: brand panel — hidden on small screens */}
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
            "We used to spend two full days reconciling fees at the end of
            every term. Now it takes an afternoon."
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Finance Officer, Private JHS, Accra
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardContent className="pt-6">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your school account
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 bg-brand-navy text-white hover:bg-brand-navy-light"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-brand-gold hover:underline">
                    Register your school
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}