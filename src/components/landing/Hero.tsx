import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy dark:bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center md:py-32">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-sm font-medium text-brand-gold"
        >
          Built for schools in Ghana
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl"
        >
          School fees, from billing to payment,{' '}
          <span className="text-brand-gold">finally in one place</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-xl text-lg text-slate-300"
        >
          FeeFlow-360 helps schools manage billing, collections, and financial
          reporting — replacing exercise books, spreadsheets, and WhatsApp
          reminders with one reliable system.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            asChild
            className="bg-brand-gold text-brand-navy hover:bg-brand-gold-light font-semibold"
          >
            <Link to="/register">
              Start your free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-slate-600 text-white hover:bg-white/10"
          >
            <a href="#features">See how it works</a>
          </Button>
        </motion.div>

        <p className="mt-6 text-sm text-slate-400">
          15-day free trial · No credit card required
        </p>
      </div>
    </section>
  )
}