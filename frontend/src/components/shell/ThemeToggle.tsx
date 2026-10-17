import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'grid size-[34px] place-items-center rounded-full border bg-card transition-colors hover:bg-muted',
        className,
      )}
    >
      {dark ? <Sun className="size-[15px]" aria-hidden="true" /> : <Moon className="size-[15px]" aria-hidden="true" />}
    </button>
  )
}
