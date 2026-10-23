import { z } from 'zod'

export const offerInputSchema = z.object({
  title: z.string().min(1, 'Title required').max(100, 'Max 100 chars'),
  description: z.string().max(500, 'Max 500 chars').optional().nullable(),
  discountPercent: z.number().min(0, 'Min 0%').max(100, 'Max 100%'),
  startDate: z.string().datetime('Invalid date'),
  endDate: z.string().datetime('Invalid date'),
  imageUrl: z.string().url('Invalid URL').optional().nullable(),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const offerUpdateSchema = offerInputSchema.partial()
export type OfferInput = z.infer<typeof offerInputSchema>
export type OfferUpdate = z.infer<typeof offerUpdateSchema>
