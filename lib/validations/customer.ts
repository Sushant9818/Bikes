import { z } from 'zod'

export const customerUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export type CustomerUpdate = z.infer<typeof customerUpdateSchema>
