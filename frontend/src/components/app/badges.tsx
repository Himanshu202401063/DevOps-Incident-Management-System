import type { Role } from '@/api/schemas'
import { ROLE_LABEL } from '@/auth/roles'
import { cn } from '@/lib/utils'

export type Severity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'
export type IncidentStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'IDENTIFIED'
  | 'MONITORING'
  | 'RESOLVED'
  | 'CLOSED'
export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export const LIFECYCLE: IncidentStatus[] = [
  'OPEN',
  'ACKNOWLEDGED',
  'INVESTIGATING',
  'IDENTIFIED',
  'MONITORING',
  'RESOLVED',
  'CLOSED',
]

const SEVERITY_STYLE: Record<Severity, string> = {
  SEV1: 'bg-sev-1-bg text-sev-1-fg',
  SEV2: 'bg-sev-2-bg text-sev-2-fg',
  SEV3: 'bg-sev-3-bg text-sev-3-fg',
  SEV4: 'bg-sev-4-bg text-sev-4-fg',
}

/** Square tag with signal bars: SEV1 fills all four, SEV4 fills one. */
export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const filled = 5 - Number(severity.slice(3))
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-[5px] rounded-xs px-[7px] font-mono text-[11.5px] leading-none font-semibold',
        SEVERITY_STYLE[severity],
        className,
      )}
    >
      <svg width="11" height="10" viewBox="0 0 11 10" aria-hidden="true">
        {[0, 1, 2, 3].map((bar) => (
          <rect
            key={bar}
            x={bar * 3}
            y={7 - bar * 2 - (bar === 3 ? 1 : 0)}
            width="2"
            height={3 + bar * 2 + (bar === 3 ? 1 : 0)}
            rx="0.5"
            fill="currentColor"
            opacity={bar < filled ? 1 : 0.25}
          />
        ))}
      </svg>
      {severity}
    </span>
  )
}

const STATUS_STYLE: Record<IncidentStatus, string> = {
  OPEN: 'bg-status-open-bg text-status-open',
  ACKNOWLEDGED: 'bg-status-acknowledged-bg text-status-acknowledged',
  INVESTIGATING: 'bg-status-investigating-bg text-status-investigating',
  IDENTIFIED: 'bg-status-identified-bg text-status-identified',
  MONITORING: 'bg-status-monitoring-bg text-status-monitoring',
  RESOLVED: 'bg-status-resolved-bg text-status-resolved',
  CLOSED: 'bg-status-closed-bg text-status-closed',
}

/** Pill with a ring that fills as the incident moves through its lifecycle. */
export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  const progress = LIFECYCLE.indexOf(status) / (LIFECYCLE.length - 1)
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-[5px] rounded-full pr-[9px] pl-[7px] font-mono text-[11px] leading-none font-semibold',
        STATUS_STYLE[status],
        className,
      )}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle
          cx="6"
          cy="6"
          r="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray={`${(progress * 15.71).toFixed(2)} 15.71`}
          transform="rotate(-90 6 6)"
        />
      </svg>
      {status}
    </span>
  )
}

const CRITICALITY_STYLE: Record<Criticality, string> = {
  LOW: 'bg-criticality-low-bg text-criticality-low',
  MEDIUM: 'bg-criticality-medium-bg text-criticality-medium',
  HIGH: 'bg-criticality-high-bg text-criticality-high',
  CRITICAL: 'bg-criticality-critical-bg text-criticality-critical-fg',
}

export function CriticalityBadge({ criticality, className }: { criticality: Criticality; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center rounded-xs px-[7px] text-[11.5px] leading-none font-semibold capitalize',
        CRITICALITY_STYLE[criticality],
        className,
      )}
    >
      {criticality.toLowerCase()}
    </span>
  )
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center rounded-full border px-2 text-[11.5px] leading-none font-semibold text-muted-foreground',
        role === 'ADMIN' && 'border-transparent bg-primary text-primary-foreground',
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  )
}
