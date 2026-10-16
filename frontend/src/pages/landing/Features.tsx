import { AlarmClock, CircleCheck, CirclePause, CornerDownRight, Siren, Timer, Zap } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { MagicCard } from '@/components/effects/magic-card'
import { cn } from '@/lib/utils'

const TARGETS = { SEV1: 15, SEV2: 60, SEV3: 240, SEV4: 1440 } as const
type Sev = keyof typeof TARGETS

const minutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`)
const heading = 'text-[30px] leading-none font-[750]'
const condensed = { fontStretch: '75%' } as const

function FeatureCard({
  children,
  className,
  surface = 'bg-card',
}: {
  children: ReactNode
  className?: string
  surface?: string
}) {
  return (
    <MagicCard
      gradientSize={380}
      gradientColor="color-mix(in oklch, var(--primary) 11%, transparent)"
      gradientOpacity={1}
      gradientFrom="var(--glow)"
      gradientTo="var(--primary)"
      surfaceClassName={surface}
      className={cn('min-w-0 rounded-2xl', className)}
    >
      <div className="flex h-full flex-col gap-4 p-6">{children}</div>
    </MagicCard>
  )
}

function SlaPlayground() {
  const [severity, setSeverity] = useState<Sev>('SEV2')
  const [percent, setPercent] = useState(40)
  const target = TARGETS[severity]
  const used = Math.round((target * percent) / 100)
  const state = percent > 100 ? 'breached' : percent > 75 ? 'at-risk' : 'running'
  const look = {
    running: { ring: 'var(--sla-running)', text: 'text-foreground', icon: Timer, label: 'Running' },
    'at-risk': { ring: 'var(--sla-at-risk)', text: 'text-sla-at-risk-fg', icon: AlarmClock, label: 'At risk' },
    breached: { ring: 'var(--sla-breached)', text: 'text-sla-breached-fg', icon: Siren, label: 'Breached' },
  }[state]
  const note =
    percent === 100
      ? 'Exactly on target. That counts as met, not a breach.'
      : state === 'breached'
        ? 'Over the target. The ring starts a second lap so you can see by how much.'
        : state === 'at-risk'
          ? 'Over 75% used. The clock turns amber and the incident shows up in "At risk".'
          : 'Inside the target. Acknowledge now and this clock stops as met.'

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
      <div role="img" aria-label={`Response clock ${look.label}, ${minutes(used)} of ${minutes(target)}`} className="relative size-[200px]">
        <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="92" fill="none" stroke="oklch(1 0 0 / 0.14)" strokeWidth="5" strokeDasharray="0.8 8.83" />
          <circle cx="100" cy="100" r="78" fill="none" stroke="oklch(1 0 0 / 0.07)" strokeWidth="14" />
          <circle cx="100" cy="100" r="78" fill="none" stroke={look.ring} strokeWidth="14" strokeDasharray={`${(Math.min(percent / 100, 1) * 490.1).toFixed(1)} 490.1`} transform="rotate(-90 100 100)" className="transition-[stroke] duration-200" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="var(--sla-breached)" strokeWidth="8" strokeDasharray={`${(Math.min(Math.max(percent / 100 - 1, 0), 1) * 389.6).toFixed(1)} 389.6`} transform="rotate(-90 100 100)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={cn('font-mono text-2xl font-semibold tnum', look.text)}>
            {state === 'breached' ? `+${minutes(used - target)}` : minutes(Math.max(target - used, 0))}
          </span>
          <span className="text-xs text-muted-foreground">{state === 'breached' ? 'over target' : 'left'}</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3.5">
        <div role="radiogroup" aria-label="Severity" className="flex w-max gap-1 rounded-full border border-white/8 bg-white/6 p-1">
          {(Object.keys(TARGETS) as Sev[]).map((sev) => (
            <button
              key={sev}
              type="button"
              role="radio"
              aria-checked={sev === severity}
              onClick={() => setSeverity(sev)}
              className={cn(
                'h-7 rounded-full px-3 font-mono text-[11.5px] font-semibold transition-colors',
                sev === severity ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-white/8',
              )}
            >
              {sev}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="elapsed" className="text-[13px] text-muted-foreground">
            Time since the incident opened
          </label>
          <input
            id="elapsed"
            type="range"
            min={0}
            max={150}
            value={percent}
            onChange={(event) => setPercent(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <span className="font-mono text-xs font-medium text-muted-foreground tnum">
            {minutes(used)} of a {minutes(target)} response target
          </span>
        </div>
        <span className={cn('inline-flex h-7 items-center gap-[7px] self-start rounded-full border border-current px-[11px] text-[13px] font-semibold', look.text)}>
          <look.icon className="size-3.5" aria-hidden="true" />
          {look.label}
        </span>
        <span className="text-[13px] text-pretty text-muted-foreground" aria-live="polite">
          {note}
        </span>
      </div>
    </div>
  )
}

const LANES = [
  { service: 'Payments', shifts: [{ name: 'Vikram', left: 0, width: 0.6, live: true }, { name: 'Asha', left: 0.6, width: 0.4 }] },
  {
    service: 'Checkout API',
    shifts: [{ name: 'Vikram', left: 0, width: 0.2 }, { name: 'Neha', left: 0.2, width: 0.42, live: true }, { name: 'Vikram', left: 0.62, width: 0.38 }],
  },
  { service: 'Search', shifts: [{ name: 'Neha', left: 0, width: 1, live: true }] },
]

const ACTIONS = [
  { id: 'x1', text: 'Alert on indexer consumer lag', who: 'Neha', due: '21 Oct' },
  { id: 'x2', text: 'Route search alerts to on-call', who: 'Asha', due: '16 Oct' },
  { id: 'x3', text: 'Health check that reads, not pings', who: 'Vikram', due: '28 Oct' },
]

export function Features() {
  const reduceMotion = useReducedMotion()
  const [dedupCount, setDedupCount] = useState(3)
  const [ai, setAi] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  const [done, setDone] = useState<Record<string, boolean>>({ x2: true })

  return (
    <section id="features" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 pt-6 pb-28 sm:px-8">
      <h2 className="mb-12 max-w-[760px] text-[clamp(48px,5.8vw,84px)] leading-[0.9] font-[750] tracking-[-0.01em]" style={{ fontStretch: '62%' }}>
        Quiet until it matters. Then very clear.
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-stretch gap-4">
          <FeatureCard surface="bg-deep" className="dark flex-[1.2_1_520px] text-foreground">
            <div className="flex flex-col gap-2">
              <h3 className="text-[36px] leading-none font-[750]" style={condensed}>
                SLA tracking
              </h3>
              <p className="text-pretty text-muted-foreground">
                Targets are set per severity on each service and copied when the incident opens. Drag the clock to see how a target is judged.
              </p>
            </div>
            <SlaPlayground />
            <div className="mt-auto flex flex-wrap gap-2">
              {[
                { label: 'Running', icon: Timer, cls: 'text-foreground' },
                { label: 'At risk', icon: AlarmClock, cls: 'text-sla-at-risk-fg' },
                { label: 'Breached', icon: Siren, cls: 'text-sla-breached-fg' },
                { label: 'Met', icon: CircleCheck, cls: 'text-sla-met-fg' },
                { label: 'Paused', icon: CirclePause, cls: 'text-muted-foreground' },
              ].map((s) => (
                <span key={s.label} className={cn('inline-flex h-7 items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-2.5 text-[12.5px] font-semibold whitespace-nowrap', s.cls)}>
                  <s.icon className="size-[13px]" aria-hidden="true" />
                  {s.label}
                </span>
              ))}
            </div>
          </FeatureCard>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
            <FeatureCard className="flex-1">
              <div className="flex flex-col gap-1.5">
                <h3 className={heading} style={condensed}>
                  On-call and escalation
                </h3>
                <p className="text-pretty text-muted-foreground">
                  Incidents go to whoever is on call. If nobody acknowledges in time, more people are notified. The assignee never changes on its own.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {LANES.map((lane) => (
                  <div key={lane.service} className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2.5">
                    <span className="text-[13px] font-semibold">{lane.service}</span>
                    <div className="relative h-7 rounded-lg bg-muted">
                      {lane.shifts.map((shift) => (
                        <span
                          key={`${shift.name}-${shift.left}`}
                          className={cn(
                            'absolute top-[3px] bottom-[3px] overflow-hidden rounded-md px-[7px] text-[11.5px] leading-[22px] font-semibold whitespace-nowrap',
                            shift.live ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground',
                          )}
                          style={{ left: `calc(${shift.left * 100}% + 3px)`, width: `calc(${shift.width * 100}% - 6px)` }}
                        >
                          {shift.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard className="flex-1">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[18px]">
                <div className="flex flex-col gap-1.5">
                  <h3 className={heading} style={condensed}>
                    Alert deduplication
                  </h3>
                  <p className="text-pretty text-muted-foreground">A flapping check becomes one alert with a count, not ten pages at 3 a.m.</p>
                  <button
                    type="button"
                    onClick={() => setDedupCount((count) => count + 1)}
                    className="mt-2 inline-flex h-8 items-center gap-[7px] self-start rounded-full border bg-background px-[13px] text-[13px] font-semibold hover:bg-muted"
                  >
                    <Zap className="size-3.5" aria-hidden="true" />
                    Fire it again
                  </button>
                </div>
                <div className="relative h-[130px] self-center" aria-live="polite">
                  <div className="absolute top-0 right-0 left-4 h-16 rounded-xl border bg-muted" />
                  <div className="absolute top-3 right-2 left-2 h-16 rounded-xl border bg-muted" />
                  <motion.div
                    key={dedupCount}
                    initial={reduceMotion ? false : { y: -10, scale: 1.03 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="absolute top-[26px] right-4 left-0 flex flex-col gap-[3px] rounded-xl border bg-card px-[13px] py-[11px] shadow-elev-2"
                  >
                    <span className="flex justify-between gap-2">
                      <span className="font-mono text-xs font-semibold">ALT-958</span>
                      <span className="font-mono text-[12.5px] font-bold text-primary tnum">×{dedupCount}</span>
                    </span>
                    <span className="text-[13px] font-medium">checkout-api 5xx rate 5.4%</span>
                    <span className="text-xs text-muted-foreground">
                      {dedupCount > 3 ? `Datadog prod · still one page, ${dedupCount} occurrences` : 'Datadog prod · linked to INC-42'}
                    </span>
                  </motion.div>
                </div>
              </div>
            </FeatureCard>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-4">
          <FeatureCard className="flex-[1_1_300px]">
            <div className="flex flex-col gap-1.5">
              <h3 className={heading} style={condensed}>
                Timeline and audit trail
              </h3>
              <p className="text-pretty text-muted-foreground">A mistake gets a correction that links back to it. The original stays.</p>
            </div>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="rounded-xl border px-3 py-2.5">
                <span className="font-mono text-[11.5px] font-medium text-muted-foreground">10:12 · Neha Iyer</span>
                <br />
                Rolled back to 4.17.2.
              </div>
              <div className="flex items-start gap-2 pl-3.5">
                <CornerDownRight className="mt-[3px] size-[13px] shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1 rounded-xl border border-dashed border-ring bg-accent px-3 py-2.5">
                  <span className="font-mono text-[11.5px] font-medium text-accent-foreground">10:15 · corrects 10:12</span>
                  <br />
                  Rolled back to 4.17.3, not 4.17.2.
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard surface="bg-accent" className="flex-[1_1_300px]">
            <div className="flex flex-col gap-1.5">
              <h3 className={heading} style={condensed}>
                AI-assisted investigation
              </h3>
              <p className="text-pretty text-accent-foreground">
                Settle AI ranks likely causes with the evidence behind each one. It only suggests: a responder accepts or rejects, and nothing runs on its own.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-[14px] border border-dashed border-ring bg-card/70 p-[13px] backdrop-blur-[10px]">
              <span className="self-start font-mono text-[10.5px] font-semibold whitespace-nowrap text-accent-foreground">AI-generated</span>
              <span className={cn('text-sm font-semibold', ai === 'rejected' && 'line-through opacity-50')}>Check the payment gateway connection pool.</span>
              <span className="text-[12.5px] text-muted-foreground">Based on INC-12 and INC-27</span>
              {ai === 'pending' ? (
                <span className="flex gap-1.5">
                  <button type="button" onClick={() => setAi('accepted')} className="h-7 rounded-full border bg-card px-3 text-[12.5px] font-semibold hover:bg-muted">
                    Accept
                  </button>
                  <button type="button" onClick={() => setAi('rejected')} className="h-7 rounded-full px-2.5 text-[12.5px] font-semibold text-muted-foreground hover:bg-muted">
                    Reject
                  </button>
                </span>
              ) : (
                <span className="flex items-center justify-between text-[12.5px]" aria-live="polite">
                  <span className="font-semibold">{ai === 'accepted' ? 'Accepted. Logged on the timeline.' : 'Rejected. Nothing changed.'}</span>
                  <button type="button" onClick={() => setAi('pending')} className="font-semibold text-primary">
                    Undo
                  </button>
                </span>
              )}
            </div>
          </FeatureCard>

          <FeatureCard className="flex-[1_1_300px]">
            <div className="flex flex-col gap-1.5">
              <h3 className={heading} style={condensed}>
                Postmortems
              </h3>
              <p className="text-pretty text-muted-foreground">Settle AI drafts it from the timeline. Follow-ups get an owner and a due date.</p>
            </div>
            <div className="flex flex-col text-[13px]">
              {ACTIONS.map((action) => {
                const isDone = !!done[action.id]
                return (
                  <button
                    key={action.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    onClick={() => setDone((all) => ({ ...all, [action.id]: !all[action.id] }))}
                    className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 border-t py-2 text-left"
                  >
                    <span
                      className={cn(
                        'grid size-[15px] place-items-center rounded-[4px] border-[1.5px] transition-colors',
                        isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {isDone && <CircleCheck className="size-2.5" />}
                    </span>
                    <span className={cn(isDone && 'text-muted-foreground line-through')}>{action.text}</span>
                    <span className="text-xs text-muted-foreground">
                      {action.who} · {action.due}
                    </span>
                  </button>
                )
              })}
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}
