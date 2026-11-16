import { z } from 'zod'

export const roleUpdateSchema = z.object({ role: z.enum(['ADMIN', 'USER']) })
export const enabledUpdateSchema = z.object({ enabled: z.boolean() })
