import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="font-mono text-sm text-muted-foreground">404</span>
      <h1 className="text-[48px] leading-[0.95] font-[750]" style={{ fontStretch: '62%' }}>
        This page doesn't exist.
      </h1>
      <p className="text-muted-foreground">Check the address, or go back to where you were working.</p>
      <Button asChild>
        <Link to="/home" className="hover:no-underline">
          Go to Home
        </Link>
      </Button>
    </section>
  )
}
