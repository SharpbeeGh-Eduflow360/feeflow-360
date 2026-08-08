import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'GH¢200',
    period: '/month',
    students: 'Up to 200 students',
    description: 'For small schools getting started',
    featured: false,
  },
  {
    name: 'Premium',
    price: 'GH¢300',
    period: '/month',
    students: 'Up to 500 students',
    description: 'For growing schools',
    featured: true,
  },
  {
    name: 'Professional',
    price: 'GH¢400',
    period: '/month',
    students: 'Unlimited students',
    description: 'For large institutions',
    featured: false,
  },
]

const commonFeatures = [
  'Billing & bulk billing',
  'Payment collection & receipts',
  'Financial reports & statements',
  'Fee carry-forward',
  'Academic year rollover',
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start with a 15-day free trial. No credit card required.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card
                className={
                  plan.featured
                    ? 'h-full border-brand-gold shadow-lg ring-1 ring-brand-gold'
                    : 'h-full'
                }
              >
                <CardHeader>
                  {plan.featured && (
                    <span className="mb-2 w-fit rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.students}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-2">
                    {commonFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-brand-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={
                      plan.featured
                        ? 'bg-brand-navy hover:bg-brand-navy-light text-white'
                        : ''
                    }
                    variant={plan.featured ? 'default' : 'outline'}
                  >
                    <Link to="/register">Start free trial</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}