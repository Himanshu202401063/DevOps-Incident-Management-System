import { CircleCheck, Play, Siren } from 'lucide-react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { FeatureCard, FeatureTitle } from './FeatureCard'

const REGIONS = [
  { id: 'mumbai', name: 'Mumbai', ms: 84 },
  { id: 'frankfurt', name: 'Frankfurt', ms: 163 },
  { id: 'virginia', name: 'Virginia', ms: 231 },
]

// Response times of the last 24 checks, as a share of the bar height. Fixed, so every render matches.
const HISTORY = [0.42, 0.5, 0.38, 0.46, 0.55, 0.4, 0.44, 0.61, 0.48, 0.39, 0.52, 0.45, 0.43, 0.58, 0.47, 0.41, 0.5, 0.63, 0.44, 0.49, 0.4, 0.53, 0.46, 0.51]
const TIMED_OUT_CHECKS = 5

/** The two-region rule: one failing region is a bad network path, two are an outage. */
export function RegionChecks() {
  const [failing, setFailing] = useState<Record<string, boolean>>({ frankfurt: true })
  const failed = REGIONS.filter((region) => failing[region.id])
  const down = failed.length >= 2
  const verdict =
    failed.length === 0
      ? 'All three regions pass.'
      : failed.length === 1
        ? `Only ${failed[0].name} fails. One bad network path pages nobody.`
        : `${failed.length === 3 ? 'All three' : 'Two'} regions agree, so ALT-961 is raised and Neha Iyer is paged.`

  return (
    <div className="flex flex-1 flex-col gap-3">
      <span className="font-mono text-xs font-medium text-muted-foreground">checkout.settle.app · HTTP 200 · every 30s</span>
      <div className="flex flex-col gap-1.5">
        {REGIONS.map((region, row) => {
          const isFailing = !!failing[region.id]
          return (
            <button
              key={region.id}
              type="button"
              aria-pressed={isFailing}
              aria-label={`${region.name} failing`}
              onClick={() => setFailing((all) => ({ ...all, [region.id]: !all[region.id] }))}
              className="grid grid-cols-[92px_minmax(0,1fr)_60px] items-center gap-3 rounded-xl border bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className={cn('size-2 shrink-0 rounded-full', isFailing ? 'bg-health-down' : 'bg-health-operational')} aria-hidden="true" />
                {region.name}
              </span>
              <span className="flex h-6 items-end gap-[2px]" aria-hidden="true">
                {HISTORY.map((_, check) => {
                  const timedOut = isFailing && check >= HISTORY.length - TIMED_OUT_CHECKS
                  return (
                    <span
                      key={check}
                      className={cn(
                        'min-w-0 flex-1 rounded-[1px] transition-[height,background-color] duration-200',
                        timedOut ? 'bg-health-down' : 'bg-health-operational/55',
                      )}
                      style={{ height: timedOut ? '100%' : `${HISTORY[(check + row * 7) % HISTORY.length] * 100}%` }}
                    />
                  )
                })}
              </span>
              <span className={cn('text-right font-mono text-xs font-semibold tnum', isFailing ? 'text-health-down-fg' : 'text-muted-foreground')}>
                {isFailing ? 'timeout' : `${region.ms} ms`}
              </span>
            </button>
          )
        })}
      </div>
      <div
        aria-live="polite"
        className={cn('mt-auto flex items-center gap-3 rounded-xl px-4 py-3 transition-colors', down ? 'bg-sev-1-bg text-health-down-fg' : 'bg-muted')}
      >
        {down ? (
          <Siren className="size-5 shrink-0" aria-hidden="true" />
        ) : (
          <CircleCheck className="size-5 shrink-0 text-health-operational-fg" aria-hidden="true" />
        )}
        <span className="flex flex-col">
          <span className="text-[15px] font-bold">{down ? 'Down' : 'Up'}</span>
          <span className={cn('text-[13px] text-pretty', !down && 'text-muted-foreground')}>{verdict}</span>
        </span>
      </div>
    </div>
  )
}

type NodeId = 'storefront' | 'checkout' | 'search' | 'payments' | 'postgres' | 'gateway'

// Positions are percentages of the map, left to right. Phones turn the map so it runs top to bottom.
// The gateway is an outside provider.
const NODES: { id: NodeId; label: string; x: number; y: number; external?: boolean }[] = [
  { id: 'storefront', label: 'Storefront', x: 12, y: 50 },
  { id: 'checkout', label: 'Checkout', x: 37.5, y: 22 },
  { id: 'search', label: 'Search', x: 37.5, y: 78 },
  { id: 'payments', label: 'Payments', x: 62.5, y: 22 },
  { id: 'postgres', label: 'Postgres', x: 62.5, y: 78 },
  { id: 'gateway', label: 'Gateway', x: 88, y: 22, external: true },
]

// The caller, then the service it calls.
const CALLS: [NodeId, NodeId][] = [
  ['storefront', 'checkout'],
  ['storefront', 'search'],
  ['checkout', 'payments'],
  ['checkout', 'postgres'],
  ['search', 'postgres'],
  ['payments', 'gateway'],
]

const NODE = Object.fromEntries(NODES.map((node) => [node.id, node])) as Record<NodeId, (typeof NODES)[number]>
const list = new Intl.ListFormat('en', { type: 'conjunction' })

/** Every service that calls the failed one, directly or through another service. */
function blastRadius(failed: NodeId) {
  const hit = new Set<NodeId>()
  const visit = (id: NodeId) => {
    for (const [caller, callee] of CALLS) {
      if (callee === id && !hit.has(caller)) {
        hit.add(caller)
        visit(caller)
      }
    }
  }
  visit(failed)
  return hit
}

/** A small dependency graph. Picking a service shows what breaks with it. */
export function ServiceMap() {
  const reduceMotion = useReducedMotion()
  const [failed, setFailed] = useState<NodeId | null>('gateway')
  const hit = failed ? blastRadius(failed) : new Set<NodeId>()
  const stateOf = (id: NodeId) => (id === failed ? 'down' : hit.has(id) ? 'hit' : failed ? 'safe' : 'ok')
  const broken = NODES.filter((node) => hit.has(node.id)).map((node) => node.label)
  const fine = NODES.filter((node) => stateOf(node.id) === 'safe').map((node) => node.label)
  const caption = !failed
    ? 'Pick a service to see its blast radius.'
    : broken.length === 0
      ? `Nothing calls ${NODE[failed].label}, so nothing else breaks.`
      : `If ${NODE[failed].label} fails, ${list.format(broken)} break${broken.length === 1 ? 's' : ''}.` +
        (fine.length ? ` ${list.format(fine)} ${fine.length === 1 ? 'keeps' : 'keep'} working.` : '')

  const links = (vertical: boolean) =>
    CALLS.map(([caller, callee]) => {
      const from = NODE[caller]
      const to = NODE[callee]
      const mid = (from.x + to.x) / 2
      const isBroken = callee === failed || hit.has(callee)
      const flowing = isBroken && !reduceMotion
      return (
        <motion.path
          key={`${caller}-${callee}`}
          d={
            vertical
              ? `M ${from.y} ${from.x} C ${from.y} ${mid}, ${to.y} ${mid}, ${to.y} ${to.x}`
              : `M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`
          }
          fill="none"
          vectorEffect="non-scaling-stroke"
          stroke={isBroken ? 'var(--health-down)' : 'var(--rail)'}
          strokeWidth={isBroken ? 2 : 1.5}
          strokeDasharray={isBroken ? '6 5' : undefined}
          animate={{ strokeDashoffset: flowing ? [0, 22] : 0 }}
          transition={flowing ? { duration: 0.9, ease: 'linear', repeat: Infinity } : { duration: 0 }}
        />
      )
    })

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="relative h-[340px] sm:h-[210px]">
        <svg className="absolute inset-0 size-full overflow-visible sm:hidden" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {links(true)}
        </svg>
        <svg className="absolute inset-0 hidden size-full overflow-visible sm:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {links(false)}
        </svg>
        {NODES.map((node) => {
          const state = stateOf(node.id)
          return (
            <button
              key={node.id}
              type="button"
              aria-pressed={state === 'down'}
              aria-label={`${node.label}${state === 'down' ? ', failed' : state === 'hit' ? ', affected' : ''}`}
              title={node.external ? 'Outside payment provider' : undefined}
              onClick={() => setFailed((current) => (current === node.id ? null : node.id))}
              className={cn(
                'absolute top-(--x) left-(--y) flex h-8 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-semibold whitespace-nowrap shadow-elev-1 transition-[opacity,background-color,border-color,color] duration-200 sm:top-(--y) sm:left-(--x)',
                node.external && 'border-dashed',
                state === 'down' && 'border-health-down bg-sev-1-bg text-health-down-fg',
                state === 'hit' && 'border-health-degraded bg-sev-3-bg text-health-degraded-fg',
                (state === 'ok' || state === 'safe') && 'bg-card hover:bg-muted',
                state === 'safe' && 'opacity-60 hover:opacity-100',
              )}
              style={{ '--x': `${node.x}%`, '--y': `${node.y}%` } as CSSProperties}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  state === 'down' ? 'bg-health-down' : state === 'hit' ? 'bg-health-degraded' : 'bg-health-operational',
                )}
                aria-hidden="true"
              />
              {node.label}
            </button>
          )
        })}
      </div>
      <p aria-live="polite" className="mt-auto text-[13px] text-pretty">
        {caption}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-health-down" aria-hidden="true" />
          Failed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-health-degraded" aria-hidden="true" />
          Affected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-full border border-dashed border-muted-foreground" aria-hidden="true" />
          Outside provider
        </span>
      </div>
    </div>
  )
}

function Heartbeat() {
  const [missed, setMissed] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 font-mono text-xs">
        <span className="font-semibold">nightly-billing</span>
        <span className="text-muted-foreground">daily at 02:00 · 15m grace</span>
      </div>
      <div role="img" aria-label={missed ? 'Last 14 runs: 13 on time, tonight missed' : 'Last 14 runs: all on time'} className="flex h-7 gap-1">
        {Array.from({ length: 14 }, (_, run) => (
          <span
            key={run}
            className={cn('flex-1 rounded-[3px] transition-colors', missed && run === 13 ? 'bg-health-down' : 'bg-health-operational')}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span aria-live="polite" className={cn('text-[13px]', missed ? 'font-semibold text-health-down-fg' : 'text-muted-foreground')}>
          {missed ? 'No ping by 02:15. ALT-962 raised.' : 'Last ping 02:03 IST, on time.'}
        </span>
        <button
          type="button"
          onClick={() => setMissed((value) => !value)}
          className="inline-flex h-8 items-center rounded-full border bg-background px-[13px] text-[13px] font-semibold hover:bg-muted"
        >
          {missed ? 'Send the ping' : "Skip tonight's ping"}
        </button>
      </div>
    </div>
  )
}

const MCP_STEPS = [
  { kind: 'ask', text: 'Is checkout down, and who is on call?' },
  { kind: 'tool', text: 'monitor_status("checkout")', result: 'down in 2 of 3 regions' },
  { kind: 'tool', text: 'who_is_on_call("checkout-api")', result: 'Neha Iyer' },
  { kind: 'answer', text: 'Yes. Mumbai and Frankfurt fail, Virginia passes. Neha Iyer is on call and was paged at 09:12.' },
] as const

function McpTranscript() {
  const box = useRef<HTMLDivElement>(null)
  const inView = useInView(box, { once: true, amount: 0.3 })
  const reduceMotion = useReducedMotion()
  const shown = inView || !!reduceMotion

  return (
    <div ref={box} className="flex flex-col gap-2 rounded-[14px] border border-dashed border-ring bg-card/70 p-[13px] text-[13px] backdrop-blur-[10px]">
      {MCP_STEPS.map((step, index) => (
        <motion.div
          key={step.text}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={shown ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.35, delay: index * 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn(
            step.kind === 'ask' && 'max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-3 py-1.5 font-medium text-primary-foreground',
            step.kind === 'tool' && 'flex flex-wrap gap-x-2 font-mono text-[11.5px]',
            step.kind === 'answer' && 'text-pretty',
          )}
        >
          {step.kind === 'tool' ? (
            <>
              <span className="font-semibold text-accent-foreground">{step.text}</span>
              <span className="text-muted-foreground">→ {step.result}</span>
            </>
          ) : (
            step.text
          )}
        </motion.div>
      ))}
    </div>
  )
}

const METRICS = [
  {
    label: 'Requests',
    value: '412/s',
    tone: 'text-foreground',
    stroke: 'var(--glow)',
    points: [0.55, 0.6, 0.58, 0.62, 0.6, 0.64, 0.61, 0.63, 0.6, 0.62, 0.59, 0.57, 0.6, 0.58, 0.61, 0.6],
  },
  {
    label: 'Errors',
    value: '6.2%',
    tone: 'text-health-down-fg',
    stroke: 'var(--health-down)',
    points: [0.05, 0.06, 0.05, 0.07, 0.05, 0.06, 0.05, 0.06, 0.08, 0.07, 0.3, 0.55, 0.7, 0.82, 0.78, 0.85],
  },
  {
    label: 'p95 latency',
    value: '840 ms',
    tone: 'text-health-degraded-fg',
    stroke: 'var(--health-degraded)',
    points: [0.25, 0.27, 0.26, 0.28, 0.25, 0.27, 0.26, 0.3, 0.28, 0.29, 0.5, 0.66, 0.72, 0.8, 0.76, 0.82],
  },
]

function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const step = 100 / (points.length - 1)
  const line = points.map((value, index) => `${(index * step).toFixed(1)},${(30 - value * 26).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

type Level = 'INFO' | 'WARN' | 'ERROR'

const LOG_LINES: { level: Level; service: string; text: string }[] = [
  { level: 'INFO', service: 'checkout-api', text: 'POST /checkout 200 in 182 ms' },
  { level: 'INFO', service: 'search', text: 'GET /search?q=shoes 200 in 41 ms' },
  { level: 'WARN', service: 'payments', text: 'gateway slow: 1240 ms, limit 1000 ms' },
  { level: 'ERROR', service: 'checkout-api', text: 'payment gateway timeout after 3000 ms' },
  { level: 'INFO', service: 'payments', text: 'retry 1 of 2 for order 88412' },
  { level: 'INFO', service: 'checkout-api', text: 'POST /checkout 200 in 204 ms' },
  { level: 'ERROR', service: 'checkout-api', text: 'payment gateway timeout after 3012 ms' },
  { level: 'WARN', service: 'checkout-api', text: '5xx rate 5.4% over the last minute' },
  { level: 'INFO', service: 'search', text: 'GET /search?q=bags 200 in 38 ms' },
  { level: 'ERROR', service: 'payments', text: 'payment gateway timeout after 3004 ms' },
]

const LEVEL_COLOR: Record<Level, string> = { INFO: 'text-muted-foreground', WARN: 'text-health-degraded-fg', ERROR: 'text-health-down-fg' }
const lineAt = (index: number) => LOG_LINES[index % LOG_LINES.length]
const inPattern = (index: number) => lineAt(index).text.startsWith('payment gateway timeout')
const VISIBLE_LINES = 10 // more than fit; the oldest fade out at the top
const MATCHED_BEFORE = 124 // pattern matches already in the window when the tail starts
const TAIL_START = 9 * 3600 + 12 * 60 // 09:12:00 IST, when INC-42's first alert fired
const pad = (value: number) => String(value).padStart(2, '0')
const timeAt = (index: number) => {
  const seconds = TAIL_START + index * 2
  return `${pad(Math.floor(seconds / 3600) % 24)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`
}

function LogsAndMetrics() {
  const tail = useRef<HTMLDivElement>(null)
  const inView = useInView(tail, { amount: 0.5 })
  const reduceMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [latest, setLatest] = useState(11)
  const live = inView && !paused && !reduceMotion

  useEffect(() => {
    if (!live) return
    const timer = window.setInterval(() => setLatest((index) => index + 1), 1400)
    return () => window.clearInterval(timer)
  }, [live])

  const shown: number[] = []
  for (let index = latest; index >= 0 && shown.length < VISIBLE_LINES; index--) {
    if (!errorsOnly || lineAt(index).level === 'ERROR') shown.unshift(index)
  }
  let matches = MATCHED_BEFORE
  for (let index = 0; index <= latest; index++) if (inPattern(index)) matches++

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {METRICS.map((metric) => (
          <div key={metric.label} className="flex min-w-0 flex-col gap-1 rounded-xl border border-white/8 bg-white/5 p-3">
            <span className="truncate text-xs text-muted-foreground">{metric.label}</span>
            <span className={cn('font-mono text-lg leading-tight font-semibold tnum', metric.tone)}>{metric.value}</span>
            <Sparkline points={metric.points} stroke={metric.stroke} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Log level" className="flex w-max gap-1 rounded-full border border-white/8 bg-white/6 p-1">
          {[
            { label: 'All levels', value: false },
            { label: 'Errors', value: true },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={errorsOnly === option.value}
              onClick={() => setErrorsOnly(option.value)}
              className={cn(
                'h-7 rounded-full px-3 text-[12.5px] font-semibold transition-colors',
                errorsOnly === option.value ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-white/8',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {!reduceMotion && (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Resume the live tail' : 'Pause the live tail'}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/8 bg-white/6 px-3 text-[12.5px] font-semibold hover:bg-white/10"
          >
            {paused ? (
              <Play className="size-3" aria-hidden="true" />
            ) : (
              <span className="size-1.5 animate-pulse rounded-full bg-health-operational" aria-hidden="true" />
            )}
            {paused ? 'Paused' : 'Live'}
          </button>
        )}
      </div>

      <div
        ref={tail}
        role="log"
        aria-label="Example log lines"
        className="flex min-h-[156px] flex-1 flex-col justify-end overflow-hidden rounded-xl border border-white/8 bg-black/30 px-3 py-1.5 font-mono text-[11.5px] leading-6 [mask-image:linear-gradient(to_bottom,transparent,black_32px)]"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((index) => {
            const line = lineAt(index)
            return (
              <motion.div
                key={index}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-[60px_42px_minmax(0,1fr)] gap-2 whitespace-nowrap sm:grid-cols-[60px_42px_92px_minmax(0,1fr)]"
              >
                <span className="text-muted-foreground tnum">{timeAt(index)}</span>
                <span className={cn('font-semibold', LEVEL_COLOR[line.level])}>{line.level}</span>
                <span className="hidden truncate text-accent-foreground sm:block">{line.service}</span>
                <span className="truncate">{line.text}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-semibold text-muted-foreground">Pattern, grouped automatically</span>
          <span className="truncate font-mono text-xs">{'payment gateway timeout after <*> ms'}</span>
        </span>
        <span className="font-mono text-[13px] font-bold text-health-down-fg tnum">×{matches}</span>
      </div>
    </>
  )
}

/** Monitoring and telemetry, the half of Settle that finds problems before anyone reports them. */
export function Monitoring() {
  return (
    <section id="monitoring" className="mx-auto max-w-(--page-max) scroll-mt-24 px-4 pb-28 sm:px-8">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
        <h2 className="max-w-[760px] text-[clamp(48px,5.8vw,84px)] leading-[0.9] font-[750] tracking-[-0.01em]" style={{ fontStretch: '62%' }}>
          Hear it from your monitors, not your customers.
        </h2>
        <p className="max-w-[360px] text-pretty text-muted-foreground">
          Uptime checks, heartbeats, logs, and metrics sit next to your incidents, so the evidence is already there when someone is paged.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-stretch gap-4">
          <FeatureCard className="flex-[1_1_420px]">
            <div className="flex flex-col gap-1.5">
              <FeatureTitle>Checks from three regions</FeatureTitle>
              <p className="text-pretty text-muted-foreground">
                HTTP, keyword, TCP, and SSL checks. A monitor is down only when two regions agree. Click a region to break it.
              </p>
            </div>
            <RegionChecks />
          </FeatureCard>

          <FeatureCard className="flex-[1.2_1_520px]">
            <div className="flex flex-col gap-1.5">
              <FeatureTitle>Service map</FeatureTitle>
              <p className="text-pretty text-muted-foreground">
                What calls what, with live health on every service. Pick one to see what breaks with it.
              </p>
            </div>
            <ServiceMap />
          </FeatureCard>
        </div>

        <div className="flex flex-wrap items-stretch gap-4">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
            <FeatureCard className="flex-auto">
              <div className="flex flex-col gap-1.5">
                <FeatureTitle>Heartbeats</FeatureTitle>
                <p className="text-pretty text-muted-foreground">A scheduled job pings Settle when it finishes. A late or missing ping raises an alert.</p>
              </div>
              <Heartbeat />
            </FeatureCard>

            <FeatureCard surface="bg-accent" className="flex-auto">
              <div className="flex flex-col gap-1.5">
                <FeatureTitle>MCP server</FeatureTitle>
                <p className="text-pretty text-accent-foreground">
                  Ask about incidents from your editor or AI assistant with a personal token. It reads; the only writes are comments and
                  acknowledgements, made as you and audited.
                </p>
              </div>
              <McpTranscript />
            </FeatureCard>
          </div>

          <FeatureCard surface="bg-deep" className="dark flex-[1.2_1_520px] text-foreground">
            <div className="flex flex-col gap-1.5">
              <FeatureTitle large>Logs and metrics</FeatureTitle>
              <p className="text-pretty text-muted-foreground">
                Live-tail and search logs, with similar lines grouped into patterns. Request rate, errors, and latency for every service.
              </p>
            </div>
            <LogsAndMetrics />
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}
