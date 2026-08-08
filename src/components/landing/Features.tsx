import { motion } from 'framer-motion'
import {
  Receipt,
  Users,
  CreditCard,
  FileText,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

const features = [
  {
    icon: Receipt,
    title: 'Billing & Bulk Billing',
    description:
      'Generate bills for a single student, a class, a level, or the entire school — with duplicate protection built in.',
  },
  {
    icon: CreditCard,
    title: 'Payments & Receipts',
    description:
      'Record cash, Mobile Money, bank transfer, POS, or card payments and issue professional receipts instantly.',
  },
  {
    icon: Users,
    title: 'Student Financial Accounts',
    description:
      'Every student has a running financial account — opening balance, charges, payments, and balance, always accurate.',
  },
  {
    icon: RefreshCw,
    title: 'Carry-Forward & Rollover',
    description:
      'Outstanding balances carry forward automatically between terms and academic years — never entered twice.',
  },
  {
    icon: FileText,
    title: 'Financial Reports',
    description:
      'Billing, collections, outstanding, and audit reports — exportable to PDF, CSV, and Excel.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Auditable',
    description:
      'Every financial action is tracked. Nothing is silently deleted — only reversed, adjusted, or corrected.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything a school needs to manage fees
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built specifically for the way Ghanaian schools handle billing,
            collections, and financial reporting.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-lg border bg-card p-6"
            >
              <feature.icon className="h-8 w-8 text-brand-gold" />
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}