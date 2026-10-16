import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef } from 'react'

const STEPS = [
  { at: '+0s', title: 'Alert', text: 'A monitoring tool or a person reports an incident on a service. Repeat alerts fold into one.' },
  { at: '+1s', title: 'Page on-call', text: 'Whoever is on call for that service is assigned and notified. Both clocks start.' },
  { at: '+6m 36s', title: 'Respond', text: 'Acknowledging stops the response clock. If nobody does, Settle escalates to more people.' },
  { at: '+3h 10m', title: 'Resolve', text: 'Work through the lifecycle and comment as you go. Resolving stops the second clock.' },
  { at: '+1d', title: 'Learn', text: 'Write the postmortem with the timeline imported, then assign action items with due dates.' },
]

/** The five steps, with a ruler that draws across once it scrolls into view. */
export function HowItWorks() {
  const ruler = useRef<HTMLDivElement>(null)
  const inView = useInView(ruler, { once: true, amount: 0.35 })
  const reduceMotion = useReducedMotion()
  const shown = inView || !!reduceMotion

  return (
    <section id="how" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 pt-28 pb-24 sm:px-8">
      <div className="mb-16 flex flex-wrap items-end justify-between gap-8">
        <h2 className="max-w-[760px] text-[clamp(48px,5.8vw,84px)] leading-[0.9] font-[750] tracking-[-0.01em]" style={{ fontStretch: '62%' }}>
          From the first alert to the last action item, in order.
        </h2>
        <p className="max-w-[360px] text-pretty text-muted-foreground">Each step is a timestamped entry on one timeline. Nothing is edited after the fact.</p>
      </div>
      <div ref={ruler} className="relative">
        <div className="absolute top-[13px] right-2.5 left-2.5 hidden h-0.5 bg-rail md:block" aria-hidden="true">
          <motion.div
            className="relative h-0.5 bg-[linear-gradient(90deg,var(--primary),var(--glow))]"
            initial={{ width: reduceMotion ? '100%' : '0%' }}
            animate={{ width: shown ? '100%' : '0%' }}
            transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1] }}
          >
            <span className="absolute -top-[5px] -right-1.5 size-3 rounded-full bg-glow shadow-[0_0_0_4px_color-mix(in_oklch,var(--glow)_30%,transparent),0_0_20px_var(--glow)]" />
          </motion.div>
        </div>
        <ol className="relative grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-x-7 gap-y-8">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              className="flex flex-col gap-3.5"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={shown ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.5, delay: index * 0.38, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="grid size-7 place-items-center rounded-full border-2 border-primary bg-background font-mono text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="font-mono text-[13px] font-semibold text-primary">{step.at}</span>
              <h3 className="text-[32px] leading-none font-[750]" style={{ fontStretch: '75%' }}>
                {step.title}
              </h3>
              <p className="text-[15px] text-pretty text-muted-foreground">{step.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
