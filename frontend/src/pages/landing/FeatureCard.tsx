import type { ReactNode } from 'react'
import { MagicCard } from '@/components/effects/magic-card'
import { cn } from '@/lib/utils'

/** A landing card with a glow that follows the pointer. */
export function FeatureCard({
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

/** The condensed card heading. `large` is for the lead card of a row. */
export function FeatureTitle({ children, large = false }: { children: ReactNode; large?: boolean }) {
  return (
    <h3 className={cn('leading-none font-[750]', large ? 'text-[36px]' : 'text-[30px]')} style={{ fontStretch: '75%' }}>
      {children}
    </h3>
  )
}
