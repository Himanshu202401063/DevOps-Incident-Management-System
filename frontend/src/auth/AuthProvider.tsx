import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, login as loginRequest, logout as logoutRequest } from '@/api/auth'
import { setUnauthorizedHandler } from '@/api/client'
import type { User } from '@/api/schemas'
import { clearToken, readToken, writeToken } from '@/api/token'

type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  status: Status
  user: User | null
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>(() => (readToken() ? 'loading' : 'anonymous'))

  const signOutLocally = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus('anonymous')
  }, [])

  // A saved token may have expired or been revoked; /me tells us before the app trusts it.
  useEffect(() => {
    if (!readToken()) return
    fetchMe()
      .then((me) => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch(signOutLocally)
  }, [signOutLocally])

  useEffect(() => {
    setUnauthorizedHandler(signOutLocally)
    return () => setUnauthorizedHandler(null)
  }, [signOutLocally])

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest(username, password)
    writeToken(response.token)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const logout = useCallback(async () => {
    // The server bumps the token version so the token stops working everywhere; sign out
    // locally even if that call fails.
    await logoutRequest().catch(() => undefined)
    signOutLocally()
  }, [signOutLocally])

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
