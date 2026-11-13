import { z } from 'zod'

const baseOfferSchema = z.object({
  title: z.string().min(1, 'Title required').max(100, 'Max 100 chars'),
  description: z.string().max(500, 'Max 500 chars').optional().nullable(),
  discountPercent: z.number().min(0, 'Min 0%').max(100, 'Max 100%'),
  startDate: z.string(),
  endDate: z.string(),
  imageUrl: z.string().optional().nullable(),
})

export const offerInputSchema = baseOfferSchema.refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const offerUpdateSchema = baseOfferSchema.partial()
export type OfferInput = z.infer<typeof offerInputSchema>
export type OfferUpdate = z.infer<typeof offerUpdateSchema>
