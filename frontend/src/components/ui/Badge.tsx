import type { HTMLAttributes, ReactNode } from 'react'

export type UserRole = 'ADMIN' | 'ENGINEER' | 'VIEWER'
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

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide uppercase ${sizeClass} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Role Badge: strictly ADMIN, ENGINEER, VIEWER as per project specification.
 */
export function RoleBadge({ role, className = '' }: { role: UserRole; className?: string }) {
  const styles: Record<UserRole, { variant: BadgeVariant; label: string }> = {
    ADMIN: { variant: 'purple', label: 'Admin' },
    ENGINEER: { variant: 'info', label: 'Engineer' },
    VIEWER: { variant: 'neutral', label: 'Viewer' },
  }

  const { variant, label } = styles[role] ?? { variant: 'neutral', label: role }
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

/**
 * Severity Badge: SEV1 to SEV4 with distinct hierarchy.
 */
export function SeverityBadge({
  severity,
  className = '',
}: {
  severity: Severity
  className?: string
}) {
  const styles: Record<Severity, { variant: BadgeVariant; label: string; custom?: string }> = {
    SEV1: { variant: 'danger', label: 'SEV1', custom: 'font-bold bg-red-100 text-red-800 border-red-300' },
    SEV2: { variant: 'warning', label: 'SEV2', custom: 'font-semibold bg-orange-100 text-orange-800 border-orange-300' },
    SEV3: { variant: 'warning', label: 'SEV3', custom: 'font-medium bg-amber-100 text-amber-800 border-amber-300' },
    SEV4: { variant: 'info', label: 'SEV4', custom: 'font-medium bg-slate-100 text-slate-800 border-slate-300' },
  }

  const config = styles[severity] ?? { variant: 'neutral', label: severity, custom: '' }
  return (
    <Badge variant={config.variant} className={`${config.custom ?? ''} ${className}`}>
      {config.label}
    </Badge>
  )
}

/**
 * Status Badge: strictly the allowed state transitions from AGENTS.md.
 */
export function StatusBadge({
  status,
  className = '',
}: {
  status: IncidentStatus
  className?: string
}) {
  const styles: Record<IncidentStatus, { variant: BadgeVariant; label: string }> = {
    OPEN: { variant: 'warning', label: 'Open' },
    ACKNOWLEDGED: { variant: 'info', label: 'Acknowledged' },
    INVESTIGATING: { variant: 'purple', label: 'Investigating' },
    IDENTIFIED: { variant: 'info', label: 'Identified' },
    MONITORING: { variant: 'warning', label: 'Monitoring' },
    RESOLVED: { variant: 'success', label: 'Resolved' },
    CLOSED: { variant: 'neutral', label: 'Closed' },
  }

  const { variant, label } = styles[status] ?? { variant: 'neutral', label: status }
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

/**
 * Criticality Badge for services: LOW, MEDIUM, HIGH, CRITICAL.
 */
export function CriticalityBadge({
  criticality,
  className = '',
}: {
  criticality: Criticality
  className?: string
}) {
  const styles: Record<Criticality, { variant: BadgeVariant; label: string }> = {
    CRITICAL: { variant: 'danger', label: 'Critical' },
    HIGH: { variant: 'warning', label: 'High' },
    MEDIUM: { variant: 'warning', label: 'Medium' },
    LOW: { variant: 'neutral', label: 'Low' },
  }

  const { variant, label } = styles[criticality] ?? { variant: 'neutral', label: criticality }
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
