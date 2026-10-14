import { z } from 'zod'

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string(),
  role: z.enum(['ADMIN', 'RESPONDER', 'VIEWER']),
})

export const loginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.iso.datetime({ offset: true }),
  user: userSchema,
})
