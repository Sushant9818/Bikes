import { z } from 'zod'

export const bikeInputSchema = z.object({
  // Details tab
  type: z.enum(['BIKE', 'SCOOTER']),
  modelName: z.string().min(1, 'Model name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).optional(),
  category: z.string().max(100).optional(),
  brand: z.string().default('Suzuki'),
  year: z.number().int().min(1900).max(2100).optional(),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive('Discount price must be positive').optional().nullable(),
  quantity: z.number().int().min(0),
  description: z.string().max(2000).optional().nullable(),
  colors: z.array(z.string()).default([]),
  imageUrl: z.string().max(500).optional().nullable(),
  images: z.array(z.string()).default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),

  // Specs tab
  specs: z.record(z.unknown()).optional().nullable(),

  // SEO tab
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
})

export type BikeInput = z.infer<typeof bikeInputSchema>
