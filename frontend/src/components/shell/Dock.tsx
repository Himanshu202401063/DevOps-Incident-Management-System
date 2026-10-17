import { ChevronUp } from 'lucide-react'
import { motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AREAS, findArea } from '@/app/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const itemClass =
  'relative inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap text-deep-foreground transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring data-[current=true]:text-deep'

/** The floating dock: one button per area; areas with several pages open a menu above it. */
export function Dock() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = findArea(pathname)?.id

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full bg-deep p-1.5 shadow-elev-3"
    >
      {AREAS.map((area) => {
        const isCurrent = area.id === current
        const content = (
          <>
            {isCurrent && (
              <motion.span
                layoutId="dock-current"
                className="absolute inset-0 rounded-full bg-deep-foreground"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                aria-hidden="true"
              />
            )}
            <area.icon className="relative size-4" aria-hidden="true" />
            <span className="relative hidden sm:inline">{area.label}</span>
            {area.pages.length > 1 && <ChevronUp className="relative size-3 opacity-60" aria-hidden="true" />}
          </>
        )

        if (area.pages.length === 1) {
          return (
            <button
              key={area.id}
              type="button"
              aria-label={area.label}
              aria-current={isCurrent ? 'page' : undefined}
              data-current={isCurrent}
              className={itemClass}
              onClick={() => navigate(area.pages[0].path)}
            >
              {content}
            </button>
          )
        }

        return (
          <DropdownMenu key={area.id}>
            <DropdownMenuTrigger
              aria-label={area.label}
              aria-current={isCurrent ? 'page' : undefined}
              data-current={isCurrent}
              className={cn(itemClass, 'data-[state=open]:bg-white/10')}
            >
              {content}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" sideOffset={10} className="min-w-[300px] rounded-lg p-1.5 shadow-elev-3">
              <DropdownMenuLabel className="text-[11.5px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
                {area.label}
              </DropdownMenuLabel>
              {area.pages.map((page) => (
                <DropdownMenuItem
                  key={page.path}
                  onSelect={() => navigate(page.path)}
                  data-active={pathname.startsWith(page.path)}
                  className="flex flex-col items-start gap-0.5 rounded-md px-3 py-2.5 data-[active=true]:bg-muted"
                >
                  <span className="text-[13.5px] font-semibold">{page.label}</span>
                  <span className="text-xs text-muted-foreground">{page.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}
    </nav>
  )
}
