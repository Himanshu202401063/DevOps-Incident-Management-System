import { Marquee } from '@/components/effects/marquee'

const ITEMS = [
  { ref: 'INC-42', text: 'Neha Iyer acknowledged in 6m 36s', color: 'var(--status-acknowledged)' },
  { ref: 'ALT-958', text: 'Deduplicated, 3 occurrences', color: 'var(--primary)' },
  { ref: 'INC-41', text: 'At risk: 19m left on resolution', color: 'var(--sla-at-risk)' },
  { ref: 'INC-39', text: 'Postmortem published with 3 action items', color: 'var(--status-resolved)' },
  { ref: 'INC-43', text: 'Paged Neha Iyer, on call for Notifications', color: 'var(--status-open)' },
  { ref: 'INC-40', text: 'Escalated to Vikram Shah. Assignment unchanged', color: 'var(--sev-2)' },
]

/** A slow strip of example activity under the hero. */
export function Ticker() {
  return (
    <div
      aria-label="Example activity"
      className="relative overflow-hidden border-b bg-card [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
    >
      <Marquee pauseOnHover className="p-0 [--duration:60s] [--gap:0px]">
        {ITEMS.map((item) => (
          <span key={item.ref} className="inline-flex items-center gap-2.5 px-7 py-4 text-sm whitespace-nowrap">
            <span className="size-2 rotate-45 rounded-[2px]" style={{ background: item.color }} aria-hidden="true" />
            <span className="font-mono text-[12.5px] font-semibold text-muted-foreground">{item.ref}</span>
            <span>{item.text}</span>
          </span>
        ))}
      </Marquee>
    </div>
  )
}
