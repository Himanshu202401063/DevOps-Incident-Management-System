import { apiFetch } from './client'
import { loginResponseSchema, noContentSchema, userSchema } from './schemas'

export function login(username: string, password: string) {
  return apiFetch('/auth/login', loginResponseSchema, { method: 'POST', body: { username, password } })
}

export function fetchMe() {
  return apiFetch('/auth/me', userSchema)
}

export function logout() {
  return apiFetch('/auth/logout', noContentSchema, { method: 'POST' })
}
