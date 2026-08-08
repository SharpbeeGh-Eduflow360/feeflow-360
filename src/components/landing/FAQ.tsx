import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How does the free trial work?',
    answer:
      'Every school gets a 15-day free trial with full access to the core platform. No credit card is required to start.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Yes. You can upgrade or downgrade your plan at any time as your student count changes.',
  },
  {
    question: 'What happens if I reach my student limit?',
    answer:
      'You will see a clear upgrade prompt before you can add more students beyond your plan\'s limit. Your existing data is never affected.',
  },
  {
    question: 'What payment methods can parents use?',
    answer:
      'FeeFlow-360 supports Cash, Mobile Money, Bank Transfer, POS, and card payments, all recorded and reconciled in one place.',
  },
  {
    question: 'Is my school\'s data secure?',
    answer:
      'Yes. Every school\'s data is isolated at the database level, protected by row-level security, and financial records are never silently deleted, only reversed or adjusted with a full audit trail.',
  },
  {
    question: 'Can I export reports?',
    answer:
      'Yes. Reports can be exported to PDF, CSV, and Excel for your own records or external audits.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-12"
        >
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}