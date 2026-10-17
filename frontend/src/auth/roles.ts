import type { Role } from '@/api/schemas'

/** What each role may do in the UI. The backend checks every request again; this only hides controls. */
const PERMISSIONS = {
  respond: ['ADMIN', 'ENGINEER'],
  configure: ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>

export type Permission = keyof typeof PERMISSIONS

export function can(role: Role | undefined, permission: Permission) {
  return role !== undefined && (PERMISSIONS[permission] as readonly Role[]).includes(role)
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  ENGINEER: 'Engineer',
  VIEWER: 'Viewer',
}
