import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearToken } from '@/api/token'
import { AuthProvider } from '@/auth/AuthProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { mockFetch } from '@/test/fetchMock'
import { LoginPage } from './LoginPage'

function renderLogin() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<p>Home page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  )
}

afterEach(() => {
  clearToken()
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('uses the field names as input ids, so labels and tests can find them', () => {
    renderLogin()
    expect(screen.getByLabelText('Username')).toHaveAttribute('id', 'username')
    expect(screen.getByLabelText('Password')).toHaveAttribute('id', 'password')
  })

  it('shows a message under each empty field and sends nothing', async () => {
    const fetchMock = mockFetch({})
    renderLogin()

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Enter your username')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('Enter your username')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('says the username or password is wrong without saying which', async () => {
    mockFetch({ 'POST /api/auth/login': { status: 401, body: { status: 401, message: 'Invalid username or password' } } })
    renderLogin()

    await userEvent.type(screen.getByLabelText('Username'), 'engineer')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password')
  })

  it('goes to Home after a successful login', async () => {
    mockFetch({
      'POST /api/auth/login': {
        body: {
          token: 't',
          expiresAt: '2026-10-14T08:00:00Z',
          user: { id: 2, username: 'engineer', displayName: 'Dev Engineer', role: 'ENGINEER' },
        },
      },
    })
    renderLogin()

    await userEvent.type(screen.getByLabelText('Username'), 'engineer')
    await userEvent.type(screen.getByLabelText('Password'), 'DevPassw0rd!')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })
})
