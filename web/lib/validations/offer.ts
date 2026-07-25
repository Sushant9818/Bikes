import { z } from 'zod'

export const offerInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
})

export type OfferInput = z.infer<typeof offerInputSchema>
