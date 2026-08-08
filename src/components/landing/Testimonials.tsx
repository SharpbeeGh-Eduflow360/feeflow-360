import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Quote } from 'lucide-react'

// Placeholder testimonials — replace with real school feedback once available
const testimonials = [
  {
    quote:
      'We used to spend two full days reconciling fees at the end of every term. Now it takes an afternoon.',
    name: 'Finance Officer',
    school: 'Private JHS, Accra',
  },
  {
    quote:
      'Parents finally get clear receipts and reminders instead of confusing WhatsApp messages.',
    name: 'School Administrator',
    school: 'Combined School, Kumasi',
  },
  {
    quote:
      'Bulk billing for an entire level used to take hours. Now it takes minutes, with no duplicate bills.',
    name: 'Bursar',
    school: 'Primary School, Tema',
  },
]

export function Testimonials() {
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
            What schools are saying
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-4 pt-6">
                  <Quote className="h-6 w-6 text-brand-gold" />
                  <p className="flex-1 text-sm text-card-foreground">
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.school}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}