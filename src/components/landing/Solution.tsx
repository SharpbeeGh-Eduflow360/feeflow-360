import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const solutions = [
  {
    title: 'One source of truth',
    description:
      'Every bill, payment, and balance lives in a single system — no more reconciling five spreadsheets.',
  },
  {
    title: 'Automatic calculations',
    description:
      'Balances are derived from real transactions, not manually typed numbers that can drift or be mistyped.',
  },
  {
    title: 'Instant financial visibility',
    description:
      'Know exactly what has been billed, collected, and outstanding — today, this term, or this year.',
  },
]

export function Solution() {
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            FeeFlow-360 replaces all of it with one reliable system
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {solutions.map((solution, i) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col gap-3"
            >
              <CheckCircle2 className="h-8 w-8 text-brand-gold" />
              <h3 className="text-lg font-semibold">{solution.title}</h3>
              <p className="text-sm text-muted-foreground">
                {solution.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}