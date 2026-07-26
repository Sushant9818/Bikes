import { z } from 'zod'

export const contactInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(100),
  phone: z.string().max(20).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(1, 'Message is required').max(2000),
})

export type ContactInput = z.infer<typeof contactInputSchema>
