import { createBrowserRouter } from 'react-router-dom'
import { AREAS, ADMIN_PAGES } from '@/app/navigation'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppShell } from '@/components/shell/AppShell'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotBuiltYetPage } from '@/pages/NotBuiltYetPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Screens not built yet show when they are planned; each is replaced by its real page as it lands.
const placeholderPaths = AREAS.flatMap((area) => area.pages.map((page) => page.path)).filter((path) => path !== '/home')

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
          ...placeholderPaths.map((path) => ({ path: `${path}/*`, element: <NotBuiltYetPage /> })),
          {
            element: <RequireAuth roles={['ADMIN']} />,
            children: ADMIN_PAGES.map((page) => ({ path: page.path, element: <NotBuiltYetPage /> })),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
