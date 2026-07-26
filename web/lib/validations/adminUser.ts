import { z } from 'zod'

export const roleUpdateSchema = z.object({ role: z.enum(['ADMIN', 'CLIENT']) })
export const enabledUpdateSchema = z.object({ enabled: z.boolean() })
