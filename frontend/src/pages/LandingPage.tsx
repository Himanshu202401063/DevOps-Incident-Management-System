import { CallToAction } from './landing/CallToAction'
import { Features } from './landing/Features'
import { Hero } from './landing/Hero'
import { HowItWorks } from './landing/HowItWorks'
import { LandingFooter } from './landing/LandingFooter'
import { LandingHeader } from './landing/LandingHeader'
import { StatusPreview } from './landing/StatusPreview'
import { Ticker } from './landing/Ticker'

/** The public product page. Everything on it is a demonstration with sample data. */
export function LandingPage() {
  return (
    <div className="overflow-x-clip bg-background text-base text-foreground">
      <LandingHeader />
      <main>
        <Hero />
        <Ticker />
        <HowItWorks />
        <Features />
        <StatusPreview />
        <CallToAction />
      </main>
      <LandingFooter />
    </div>
  )
}
