import { motion } from 'framer-motion'
import { BarChart3, FileDown, TrendingUp } from 'lucide-react'

const reportTypes = [
  'Billing & Collection reports',
  'Outstanding & Overdue reports',
  'Student Statements',
  'Cash Book',
  'Daily & Monthly Collections',
  'Annual & Term Reports',
]

export function Reports() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Reporting that actually answers your questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Know exactly how much was collected today, this term, or this
              year — and export it whenever you need to.
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {reportTypes.map((report) => (
                <li key={report} className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 shrink-0 text-brand-gold" />
                  {report}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <FileDown className="h-4 w-4" />
              Export to PDF, CSV, or Excel
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border bg-card p-8"
          >
            <BarChart3 className="h-10 w-10 text-brand-gold" />
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Collected</span>
                  <span className="font-semibold">GH¢184,800</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-4/5 rounded-full bg-brand-gold" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className="font-semibold">GH¢36,200</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-1/5 rounded-full bg-brand-navy dark:bg-slate-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}