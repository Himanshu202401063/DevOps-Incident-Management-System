import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIstTime } from '@/components/app/IstClock'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { Wordmark } from '@/components/shell/Wordmark'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Status page', href: '#status' },
]

/** A floating pill that narrows once the page scrolls. */
export function LandingHeader() {
  const { hhmmss } = useIstTime()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="pointer-events-none fixed top-3.5 right-0 left-0 z-50 flex justify-center px-4 sm:px-8">
      <header
        className={cn(
          'pointer-events-auto flex h-[54px] max-w-full items-center gap-[18px] rounded-full border border-foreground/12 bg-background/60 pr-2 pl-[18px] backdrop-blur-[18px] backdrop-saturate-[1.4] transition-[width,box-shadow] duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          scrolled ? 'w-[860px] shadow-[0_12px_40px_-12px_oklch(0.2_0.008_60/0.35)]' : 'w-[calc(var(--page-max)-4rem)]',
        )}
      >
        <a href="#top" aria-label="Settle, back to top" className="text-foreground hover:no-underline">
          <Wordmark size={28} />
        </a>
        <nav aria-label="Sections" className="hidden flex-1 justify-center gap-1 text-[14.5px] font-medium whitespace-nowrap md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-[13px] py-[7px] text-muted-foreground hover:bg-foreground/7 hover:text-foreground hover:no-underline"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex-1 md:hidden" />
        <span title="Indian Standard Time" className="hidden items-center gap-1.5 font-mono text-xs font-medium whitespace-nowrap text-muted-foreground tnum sm:inline-flex">
          <span className="size-1.5 rounded-full bg-health-operational" aria-hidden="true" />
          {hhmmss} IST
        </span>
        <ThemeToggle className="border-0 bg-transparent" />
        <Link
          to="/login"
          className="inline-flex h-[38px] items-center rounded-full bg-foreground px-[18px] text-[14.5px] font-semibold whitespace-nowrap text-background hover:no-underline"
        >
          Log in
        </Link>
      </header>
    </div>
  )
}
