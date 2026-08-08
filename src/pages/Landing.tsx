import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Problem } from '@/components/landing/Problem'
import { Solution } from '@/components/landing/Solution'
import { Features } from '@/components/landing/Features'
import { Workflow } from '@/components/landing/Workflow'
import { Reports } from '@/components/landing/Reports'
import { Security } from '@/components/landing/Security'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { FAQ } from '@/components/landing/FAQ'
import { Footer } from '@/components/landing/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <Workflow />
      <Reports />
      <Security />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}