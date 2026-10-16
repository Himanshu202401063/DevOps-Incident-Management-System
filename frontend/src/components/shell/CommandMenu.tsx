import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_PAGES, AREAS } from '@/app/navigation'
import { useAuth } from '@/auth/AuthProvider'
import { can } from '@/auth/roles'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

/** ⌘K / Ctrl+K: jump to any page by typing its name. */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Go to" description="Search for a page">
      <CommandInput placeholder="Go to a page…" />
      <CommandList>
        <CommandEmpty>No page with that name.</CommandEmpty>
        {AREAS.map((area) => (
          <CommandGroup key={area.id} heading={area.label}>
            {area.pages.map((page) => (
              <CommandItem key={page.path} value={`${area.label} ${page.label}`} onSelect={() => go(page.path)}>
                <area.icon aria-hidden="true" />
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {can(user?.role, 'configure') && (
          <CommandGroup heading="Admin">
            {ADMIN_PAGES.map((page) => (
              <CommandItem key={page.path} onSelect={() => go(page.path)}>
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
