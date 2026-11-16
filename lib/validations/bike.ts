import { z } from 'zod'

// Single source of truth for vehicle/part input validation. Aligned to the
// Prisma schema: Vehicle (type BIKE|SCOOTER, optional category) and Part
// (PartType enum, no category column).

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
  specs: z.record(z.string(), z.unknown()).optional(),

  // SEO tab
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
})

export type BikeInput = z.infer<typeof bikeInputSchema>

// Scooters share the vehicle shape but carry no category and derive their
// VehicleType server-side (always SCOOTER), so both are omitted from input.
export const scooterInputSchema = bikeInputSchema.omit({ type: true, category: true })

export type ScooterInput = z.infer<typeof scooterInputSchema>

// Parts map to the Prisma Part model. The Part model has a PartType enum
// (`type`) rather than a free-text category column.
export const partInputSchema = z.object({
  type: z.enum(['BIKE_PART', 'SCOOTER_PART']),
  partName: z.string().min(1, 'Part name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  compatibleModel: z.string().max(100).optional().nullable(),
  brand: z.string().default('Suzuki'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  minStock: z.number().int().min(0, 'Min stock cannot be negative').default(10),
  imageUrl: z.string().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export type PartInput = z.infer<typeof partInputSchema>
