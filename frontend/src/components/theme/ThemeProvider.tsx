import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

// Same key the Settle design used; index.html reads it before React loads, so there is no flash.
const STORAGE_KEY = 'settle-theme'

interface ThemeState {
  theme: Theme
  resolvedTheme: Resolved
  systemTheme: Resolved
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeState | null>(null)

const systemPrefersDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

function readStored(fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : fallback
  } catch {
    return fallback
  }
}

/** Puts the "dark" class on <html> and remembers the choice. Replaces next-themes, whose injected script React 19 warns about. */
export function ThemeProvider({ children, defaultTheme = 'light' }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(() => readStored(defaultTheme))
  const [systemTheme, setSystemTheme] = useState<Resolved>(() => (systemPrefersDark() ? 'dark' : 'light'))
  const resolvedTheme: Resolved = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemTheme(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The choice simply won't be remembered.
    }
  }, [])

  const value = useMemo(() => ({ theme, resolvedTheme, systemTheme, setTheme }), [theme, resolvedTheme, systemTheme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
