import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CommandMenu } from './CommandMenu'
import { Dock } from './Dock'
import { TopBar } from './TopBar'

/** Every logged-in page: the top bar, the page itself, and the dock floating at the bottom. */
export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar onSearch={() => setSearchOpen(true)} />
      {/* Bottom padding keeps the last row of a page clear of the dock. */}
      <main className="px-4 pt-8 pb-32 sm:px-8">
        <Outlet />
      </main>
      <Dock />
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
