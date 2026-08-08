import { motion } from 'framer-motion'
import { Lock, Database, Eye, ShieldCheck } from 'lucide-react'

const securityPoints = [
  {
    icon: Database,
    title: 'Multi-tenant isolation',
    description:
      'Your school\'s data is isolated at the database level. Other schools can never access your records.',
  },
  {
    icon: Lock,
    title: 'Role-based access',
    description:
      'Bursars, accountants, cashiers, and auditors each see only what their role permits.',
  },
  {
    icon: Eye,
    title: 'Full audit trail',
    description:
      'Every bill, payment, and adjustment is logged — who did it, when, and what changed.',
  },
  {
    icon: ShieldCheck,
    title: 'Financial integrity',
    description:
      'Nothing is silently deleted. Corrections happen through reversals and adjustments, always traceable.',
  },
]

export function Security() {
  return (
    <section className="bg-brand-navy py-24 dark:bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Built with security as a first principle
          </h2>
          <p className="mt-4 text-slate-300">
            Financial data deserves serious protection. Here's how we take
            that seriously.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {securityPoints.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-lg border border-white/10 bg-white/5 p-5"
            >
              <point.icon className="h-7 w-7 text-brand-gold" />
              <h3 className="mt-3 font-medium text-white">{point.title}</h3>
              <p className="mt-1 text-sm text-slate-300">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}