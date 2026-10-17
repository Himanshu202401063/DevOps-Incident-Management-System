import { Check, RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { LIFECYCLE, SeverityBadge, StatusBadge } from '@/components/app/badges'
import { cn } from '@/lib/utils'
import type { useIncidentReplay } from './useIncidentReplay'

type Replay = ReturnType<typeof useIncidentReplay>

const statusVar = (status: string) => `var(--status-${status.toLowerCase()})`

function Dial({ replay }: { replay: Replay }) {
  const { response, resolution, simDate, simTime, handDeg, status } = replay
  const ringColor = (stopped: boolean) => (stopped ? 'var(--sla-met)' : 'var(--sla-running)')
  return (
    <div
      role="img"
      aria-label={`Incident replay at ${simTime} IST. Status ${status}. Response ${response.label}. Resolution ${resolution.label}.`}
      className="relative aspect-square w-full max-w-[380px] justify-self-center"
    >
      <svg viewBox="0 0 300 300" className="block size-full overflow-visible" aria-hidden="true">
        <defs>
          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx="150" cy="150" r="141" fill="none" stroke="oklch(1 0 0 / 0.14)" strokeWidth="7" strokeDasharray="1 13.76" />
        <circle cx="150" cy="150" r="141" fill="none" stroke="oklch(1 0 0 / 0.45)" strokeWidth="12" strokeDasharray="2 71.8" transform="rotate(-90.4 150 150)" />
        {[
          { r: 119, ring: response },
          { r: 98, ring: resolution },
        ].map(({ r, ring }) => (
          <g key={r}>
            <circle cx="150" cy="150" r={r} fill="none" stroke="oklch(1 0 0 / 0.07)" strokeWidth="13" />
            <circle cx="150" cy="150" r={r} fill="none" stroke={ringColor(ring.stopped)} strokeWidth="13" strokeDasharray={ring.dash} transform="rotate(-90 150 150)" filter="url(#ringGlow)" opacity="0.6" />
            <circle cx="150" cy="150" r={r} fill="none" stroke={ringColor(ring.stopped)} strokeWidth="13" strokeDasharray={ring.dash} transform="rotate(-90 150 150)" />
          </g>
        ))}
        <line x1="22" y1="150" x2="62" y2="150" stroke="oklch(1 0 0 / 0.5)" strokeWidth="1.5" />
        <line x1="150" y1="78" x2="150" y2="38" stroke="var(--glow)" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${handDeg} 150 150)`} opacity="0.8" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-mono text-xs font-medium text-muted-foreground">{simDate}</span>
        <span className="font-mono text-[clamp(28px,3.6vw,40px)] leading-none font-semibold tracking-[-0.03em] tnum [text-shadow:0_0_24px_color-mix(in_oklch,var(--glow)_35%,transparent)]">
          {simTime}
        </span>
        <span className="font-mono text-xs font-medium text-muted-foreground">IST</span>
      </div>
    </div>
  )
}

function ClockCard({ name, which, ring }: { name: string; which: string; ring: Replay['response'] }) {
  const color = ring.stopped ? 'text-sla-met-fg' : 'text-foreground'
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/8 bg-white/4 px-3.5 py-3">
      <span className="flex items-center justify-between text-[12.5px] text-muted-foreground">
        <span className="flex items-center gap-[7px]">
          <span className={cn('size-[9px] rounded-full', ring.stopped ? 'bg-sla-met' : 'bg-sla-running')} />
          {name}
        </span>
        <span>{which}</span>
      </span>
      <span className={cn('font-mono text-[22px] font-semibold tnum', color)}>{ring.big}</span>
      <span className={cn('text-[12.5px] font-semibold', color)}>{ring.label}</span>
    </div>
  )
}

/** The landing-page replay: an incident from first alert to postmortem, with both SLA clocks. */
export function IncidentReplay({ replay }: { replay: Replay }) {
  const reduceMotion = useReducedMotion()
  const statusIndex = LIFECYCLE.indexOf(replay.status)
  const { page } = replay

  return (
    <div id="replay" className="relative mx-auto mt-16 max-w-[calc(var(--page-max)-4rem)] scroll-mt-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl p-px [background:linear-gradient(140deg,color-mix(in_oklch,var(--glow)_55%,transparent),oklch(1_0_0/0.06)_30%,oklch(1_0_0/0.04)_70%,color-mix(in_oklch,var(--glow)_35%,transparent))] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
      />
      <div className="relative overflow-hidden rounded-2xl bg-[oklch(0.2_0.008_60/0.58)] text-left shadow-[0_40px_90px_-30px_oklch(0.05_0.008_60/0.9),inset_0_1px_0_oklch(1_0_0/0.08)] backdrop-blur-[22px] backdrop-saturate-[1.3]">
        <div className="flex flex-wrap items-center gap-3.5 border-b border-white/8 px-[22px] py-3.5 whitespace-nowrap">
          <span className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="size-2.5 rounded-full bg-white/16" />
            ))}
          </span>
          <span className="font-mono text-[13px] font-semibold text-muted-foreground">INC-42</span>
          <span className="text-[15px] font-semibold">Checkout 5xx above 5%</span>
          <SeverityBadge severity="SEV2" />
          <StatusBadge status={replay.status} />
          <span className="text-[13px] text-muted-foreground">Checkout API</span>
          <button
            type="button"
            onClick={replay.play}
            className="ml-auto inline-flex h-[30px] items-center gap-[7px] rounded-full border border-white/14 bg-white/5 px-3 text-[13px] font-semibold hover:bg-white/10"
          >
            <RotateCcw className="size-[13px]" aria-hidden="true" />
            Replay
          </button>
        </div>

        <ol className="grid grid-cols-7 gap-1 px-[22px] pt-3.5" aria-label="Lifecycle">
          {LIFECYCLE.map((step, index) => (
            <li key={step} className="flex min-w-0 flex-col gap-1.5">
              <span
                className="h-[3px] rounded-[2px] transition-[background] duration-200"
                style={{
                  background: index <= statusIndex ? statusVar(step) : 'oklch(1 0 0 / 0.1)',
                  boxShadow: index === statusIndex ? `0 0 10px ${statusVar(step)}` : 'none',
                }}
              />
              <span
                className={cn(
                  'truncate font-mono text-[10.5px]',
                  index === statusIndex ? 'font-bold text-foreground' : 'font-medium text-muted-foreground',
                )}
                aria-current={index === statusIndex ? 'step' : undefined}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="grid items-start gap-7 px-[22px] pt-[18px] pb-[26px] md:grid-cols-[minmax(260px,380px)_minmax(0,1fr)]">
          <Dial replay={replay} />
          <div className="flex min-w-0 flex-col gap-[18px]">
            <ol className="relative min-w-0" aria-label="Timeline">
              {replay.entries.map((entry) => (
                <li
                  key={entry.at}
                  className="grid grid-cols-[96px_26px_minmax(0,1fr)]"
                  style={{
                    opacity: entry.progress,
                    transform: `translateY(${((1 - entry.progress) * 10).toFixed(1)}px)`,
                    filter: `blur(${((1 - entry.progress) * 6).toFixed(1)}px)`,
                  }}
                  aria-hidden={entry.progress === 0}
                >
                  <span className="pt-0.5 font-mono text-xs font-medium whitespace-nowrap text-muted-foreground tnum">{entry.time}</span>
                  <span className="relative" aria-hidden="true">
                    <span className="absolute top-0 bottom-0 left-[11px] w-0.5" style={{ background: statusVar(entry.status) }} />
                    <span
                      className="absolute top-1 left-[5px] size-3.5 rounded-full"
                      style={{
                        background: entry.title.startsWith('Post') ? 'var(--primary)' : statusVar(entry.status),
                        boxShadow: `0 0 0 3px oklch(0.2 0.008 60), 0 0 12px ${entry.title.startsWith('Post') ? 'var(--primary)' : statusVar(entry.status)}`,
                      }}
                    />
                  </span>
                  <div className="flex min-w-0 flex-col gap-px pb-3">
                    <span className="text-[14.5px] leading-[1.3] font-semibold">{entry.title}</span>
                    <span className="text-[13px] leading-[1.4] text-pretty text-muted-foreground">{entry.text}</span>
                  </div>
                </li>
              ))}
            </ol>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
              <ClockCard name="Response" which="outer ring" ring={replay.response} />
              <ClockCard name="Resolution" which="inner ring" ring={replay.resolution} />
              <div
                className="col-span-full flex min-h-[66px] flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[18px] border border-white/18 bg-[oklch(0.97_0.008_60/0.14)] p-3.5 shadow-[0_24px_50px_-16px_oklch(0.05_0.008_60/0.8)] backdrop-blur-[24px] backdrop-saturate-150"
                style={{
                  opacity: page.progress,
                  transform: `translateY(${((1 - page.progress) * 14).toFixed(1)}px) scale(${(0.96 + page.progress * 0.04).toFixed(3)})`,
                }}
                aria-live="polite"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="7" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" />
                      <circle cx="10" cy="10" r="2" fill="var(--glow)" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-[13px] leading-[1.35]">
                    <span className="flex justify-between gap-2">
                      <span className="font-bold">Settle</span>
                      <span className="font-mono text-[11px] font-medium text-muted-foreground">now</span>
                    </span>
                    <span>INC-42 assigned to you: Checkout 5xx above 5%</span>
                    <span className="text-muted-foreground">You're on call for Checkout API.</span>
                  </span>
                </div>
                {page.waiting && (
                  <>
                    <motion.button
                      type="button"
                      onClick={replay.acknowledge}
                      className="h-9 rounded-[10px] bg-primary px-[18px] font-bold text-primary-foreground"
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              boxShadow: [
                                '0 0 0 0 color-mix(in oklch, var(--glow) 55%, transparent)',
                                '0 0 0 12px color-mix(in oklch, var(--glow) 0%, transparent)',
                              ],
                            }
                      }
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      Acknowledge
                    </motion.button>
                    <span className="font-mono text-[11.5px] font-medium whitespace-nowrap text-muted-foreground tnum">
                      Try it. Response clock running: {page.running}
                    </span>
                  </>
                )}
                {page.done && (
                  <span className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/8 px-3.5 text-[13.5px] font-semibold whitespace-nowrap text-sla-met-fg">
                    <Check className="size-3.5" aria-hidden="true" />
                    {page.doneText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-0.5 bg-white/6">
          <div className="h-0.5 bg-primary shadow-[0_0_10px_var(--primary)]" style={{ width: `${replay.progress * 100}%` }} />
        </div>
      </div>
      <p className="mx-auto mt-3.5 max-w-[calc(var(--page-max)-4rem)] text-center text-[13px] text-muted-foreground">
        A real incident shape, three hours compressed into a few seconds. Times in Indian Standard Time.
      </p>
    </div>
  )
}
