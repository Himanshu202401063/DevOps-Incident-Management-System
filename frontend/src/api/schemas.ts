import { z } from 'zod'

export const roleSchema = z.enum(['ADMIN', 'ENGINEER', 'VIEWER'])

export type Role = z.infer<typeof roleSchema>

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string(),
  role: roleSchema,
})

export type User = z.infer<typeof userSchema>

export const loginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.iso.datetime({ offset: true }),
  user: userSchema,
})

export const noContentSchema = z.undefined()
