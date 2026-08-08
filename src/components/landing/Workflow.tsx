import { motion } from 'framer-motion'

const billingSteps = [
  { step: '1', title: 'Select students', description: 'Pick a class, level, or the whole school' },
  { step: '2', title: 'Choose fee structure', description: 'Select or build a bill template' },
  { step: '3', title: 'Review & confirm', description: 'See totals and duplicate warnings before generating' },
  { step: '4', title: 'Bills generated', description: 'Every student gets an accurate, published bill' },
]

const paymentSteps = [
  { step: '1', title: 'Record payment', description: 'Cash, Mobile Money, bank, POS, or card' },
  { step: '2', title: 'Auto-allocation', description: 'Payment applies to the right bills automatically' },
  { step: '3', title: 'Receipt issued', description: 'A verifiable receipt is generated instantly' },
  { step: '4', title: 'Balance updates', description: 'The student\'s balance reflects the new total in real time' },
]

function WorkflowRow({
  title,
  steps,
}: {
  title: string
  steps: typeof billingSteps
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-lg border bg-card p-5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white dark:bg-brand-gold dark:text-brand-navy">
              {s.step}
            </span>
            <h4 className="mt-3 font-medium text-card-foreground">{s.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function Workflow() {
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
            How it works
          </h2>
          <p className="mt-4 text-muted-foreground">
            From billing to payment, in a few clear steps.
          </p>
        </motion.div>

        <div className="mt-16 flex flex-col gap-16">
          <WorkflowRow title="Billing workflow" steps={billingSteps} />
          <WorkflowRow title="Payment workflow" steps={paymentSteps} />
        </div>
      </div>
    </section>
  )
}