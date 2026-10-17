import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const IST_OFFSET_MS = 330 * 60_000
const pad = (n: number) => String(n).padStart(2, '0')

/** The current time in IST, re-rendered every second. */
export function useIstTime() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const ist = new Date(now + IST_OFFSET_MS)
  return {
    now,
    hours: ist.getUTCHours(),
    minutes: ist.getUTCMinutes(),
    seconds: ist.getUTCSeconds(),
    hhmm: `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`,
    hhmmss: `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`,
  }
}

/** A ring that fills through the hour, with the IST time in the middle. Decorative. */
export function IstClock({ className }: { className?: string }) {
  const { minutes, seconds, hhmm } = useIstTime()
  const circumference = 728.8
  const filled = ((minutes * 60 + seconds) / 3600) * circumference
  return (
    <div aria-hidden="true" className={cn('relative aspect-square w-[min(300px,50vh)]', className)}>
      <svg viewBox="0 0 300 300" className="size-full overflow-visible">
        <circle cx="150" cy="150" r="141" fill="none" stroke="oklch(1 0 0 / 0.14)" strokeWidth="7" strokeDasharray="1 13.76" />
        <circle cx="150" cy="150" r="116" fill="none" stroke="oklch(1 0 0 / 0.07)" strokeWidth="14" />
        <circle
          cx="150"
          cy="150"
          r="116"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="14"
          strokeDasharray={`${filled.toFixed(1)} ${circumference}`}
          transform="rotate(-90 150 150)"
          className="transition-[stroke-dasharray] duration-1000 ease-linear"
        />
        <circle cx="150" cy="150" r="5" fill="var(--glow)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="font-mono text-[44px] leading-none font-semibold tracking-[-0.03em] tnum">{hhmm}</span>
        <span className="font-mono text-[12.5px] font-medium text-muted-foreground">IST</span>
      </div>
    </div>
  )
}
