import { z } from 'zod'

export const partTypeEnum = z.enum(['BIKE_PART', 'SCOOTER_PART'])

export const partInputSchema = z.object({
  type: partTypeEnum,
  partName: z.string().min(1, 'Part name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  compatibleModel: z.string().max(100).optional().nullable(),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0).default(10),
  imageUrl: z.string().max(500).optional().nullable(),
})

export type PartInput = z.infer<typeof partInputSchema>
