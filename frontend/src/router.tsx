import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AREAS, ADMIN_PAGES } from '@/app/navigation'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppShell } from '@/components/shell/AppShell'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotBuiltYetPage } from '@/pages/NotBuiltYetPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { UsersPage } from '@/pages/UsersPage'

// Dock screens that exist so far, open to every role; each page hides what a role can't use.
const SCREENS: Record<string, ReactNode> = { '/services': <ServicesPage /> }

// Admin screens that exist so far; the rest of ADMIN_PAGES show when they are planned.
const ADMIN_SCREENS: Record<string, ReactNode> = { '/users': <UsersPage /> }

// Screens not built yet show when they are planned; each is replaced by its real page as it lands.
const placeholderPaths = AREAS.flatMap((area) => area.pages.map((page) => page.path)).filter(
  (path) => path !== '/home' && !(path in SCREENS),
)

export const router = createBrowserRouter([
  // Public pages load on demand, so logged-in users never download the landing animations.
  { path: '/', lazy: () => import('@/pages/LandingPage').then((m) => ({ Component: m.LandingPage })) },
  { path: '/login', element: <LoginPage /> },
  { path: '/status', lazy: () => import('@/pages/StatusPage').then((m) => ({ Component: m.StatusPage })) },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <HomePage /> },
          ...Object.entries(SCREENS).map(([path, element]) => ({ path, element })),
          ...placeholderPaths.map((path) => ({ path: `${path}/*`, element: <NotBuiltYetPage /> })),
          {
            element: <RequireAuth roles={['ADMIN']} />,
            children: ADMIN_PAGES.map((page) => ({ path: page.path, element: ADMIN_SCREENS[page.path] ?? <NotBuiltYetPage /> })),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
