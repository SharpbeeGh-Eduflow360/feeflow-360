import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

const problems = [
  'Incorrect balances from manual calculations',
  'Missing payment records and lost receipts',
  'Duplicate bills sent to students',
  'Difficult end-of-term reconciliation',
  'Poor communication with parents',
  'No clear picture of total collections',
]

export function Problem() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Managing fees the old way is costing you time
          </h2>
          <p className="mt-4 text-muted-foreground">
            Exercise books, spreadsheets, and WhatsApp messages weren't built
            to manage a school's finances.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, i) => (
            <motion.div
              key={problem}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-lg border bg-card p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-card-foreground">{problem}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}