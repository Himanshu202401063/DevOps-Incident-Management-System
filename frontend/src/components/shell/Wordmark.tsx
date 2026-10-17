import { cn } from '@/lib/utils'

/** "settle" in condensed Archivo over the ice-blue wave. */
export function Wordmark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex flex-col items-start leading-none', className)}>
      <span className="font-extrabold tracking-[-0.01em]" style={{ fontSize: size, fontStretch: '70%' }}>
        settle
      </span>
      <svg
        width={Math.round(size * 2.3)}
        height="6"
        viewBox="0 0 60 6"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="mt-px"
      >
        <path
          d="M1.5 3 Q9 0.5 16.5 3 T31.5 3 T46.5 3 T58.5 3"
          fill="none"
          stroke="var(--ring)"
          strokeWidth="2.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  )
}
