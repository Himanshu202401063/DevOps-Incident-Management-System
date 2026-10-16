import { TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { UptimeBars } from '@/components/app/UptimeBars'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { ACTIVE_INCIDENT, COMPONENTS, PAST_INCIDENTS, STATUS_SUMMARY, type Health } from '@/data/statusSample'
import { cn } from '@/lib/utils'

const HEALTH_STYLE: Record<Health, { dot: string; text: string }> = {
  Operational: { dot: 'bg-health-operational', text: 'text-health-operational-fg' },
  Degraded: { dot: 'bg-health-degraded', text: 'text-health-degraded-fg' },
  'Major outage': { dot: 'bg-health-down', text: 'text-health-down-fg' },
}

const UPDATE_COLOR = { identified: 'text-status-identified', investigating: 'text-status-investigating' } as const

const sectionTitle = 'text-[20px] leading-none font-[750]'
const condensed = { fontStretch: '75%' } as const

/** The public page customers check during an incident. No login. */
export function StatusPage() {
  return (
    <div className="min-h-screen bg-background text-[14px] text-foreground">
      <div className="mx-auto flex max-w-[880px] flex-col gap-8 px-6 pt-10 pb-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[30px] leading-none font-extrabold tracking-[-0.01em]" style={{ fontStretch: '70%' }}>
              settle
            </span>
            <span className="text-[15px] font-semibold text-muted-foreground">status</span>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex items-center gap-3.5 rounded-lg bg-sev-2-bg px-5 py-5 text-sev-2-fg">
          <TriangleAlert className="size-[22px] shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[24px] leading-[1.1] font-[750]" style={condensed}>
              {STATUS_SUMMARY.title}
            </h1>
            <span className="text-[13px]">{STATUS_SUMMARY.text}</span>
          </div>
        </div>

        <section className="flex flex-col gap-3.5">
          <h2 className={sectionTitle} style={condensed}>
            Active incident
          </h2>
          <article className="flex flex-col rounded-lg border bg-card">
            <div className="flex flex-col gap-1.5 border-b px-5 py-4">
              <span className="text-base font-semibold">{ACTIVE_INCIDENT.title}</span>
              <span className="font-mono text-xs font-medium text-muted-foreground">{ACTIVE_INCIDENT.started}</span>
            </div>
            <ol className="px-5 pt-1.5 pb-2.5">
              {ACTIVE_INCIDENT.updates.map((update, index) => (
                <li key={update.time} className={cn('grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3', index > 0 && 'border-t')}>
                  <div className="flex flex-col gap-0.5">
                    <span className={cn('text-[13px] font-bold', UPDATE_COLOR[update.status])}>{update.label}</span>
                    <span className="font-mono text-[11.5px] font-medium text-muted-foreground">{update.time}</span>
                  </div>
                  <p className="text-pretty">{update.text}</p>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={sectionTitle} style={condensed}>
              Components
            </h2>
            <span className="text-[12.5px] text-muted-foreground">Last 90 days</span>
          </div>
          <div className="overflow-hidden rounded-lg border bg-card">
            {COMPONENTS.map((component, index) => (
              <div key={component.name} className={cn('flex flex-col gap-2.5 px-5 py-4', index > 0 && 'border-t')}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{component.name}</span>
                  <span className={cn('inline-flex items-center gap-[7px] text-[13px] font-semibold whitespace-nowrap', HEALTH_STYLE[component.health].text)}>
                    <span className={cn('size-2 rounded-full', HEALTH_STYLE[component.health].dot)} aria-hidden="true" />
                    {component.health}
                  </span>
                </div>
                <UptimeBars name={component.name} events={component.events} uptime={component.uptime} />
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3.5">
          <h2 className={sectionTitle} style={condensed}>
            Past incidents
          </h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            {PAST_INCIDENTS.map((incident, index) => (
              <div key={incident.date} className={cn('grid grid-cols-[90px_minmax(0,1fr)] gap-4 px-5 py-3.5', index > 0 && 'border-t')}>
                <span className="pt-0.5 font-mono text-xs font-medium text-muted-foreground">{incident.date}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{incident.title}</span>
                  <span className="text-[13px] text-muted-foreground">{incident.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 pt-2 text-[12.5px] text-muted-foreground">
          <span>Times in IST. Sample data until the status page reads from live monitors.</span>
          <Link to="/" className="font-semibold">
            Powered by Settle
          </Link>
        </footer>
      </div>
    </div>
  )
}
