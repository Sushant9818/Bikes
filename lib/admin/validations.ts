import { z } from 'zod'

export const bikeSchema = z.object({
  modelName: z.string().min(1, 'Model name is required').max(100),
  category: z.enum(['Sport', 'Commuter', 'Cruiser', 'Adventure']),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive('Discount price must be positive').optional().nullable(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  status: z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  colors: z.array(z.string().min(1)).min(1, 'At least one color required'),
  specs: z.record(z.any()).optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(160).optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
})

export type BikeFormData = z.infer<typeof bikeSchema>

export const scooterSchema = z.object({
  modelName: z.string().min(1, 'Model name is required').max(100),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive('Discount price must be positive').optional().nullable(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  status: z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  colors: z.array(z.string().min(1)).min(1, 'At least one color required'),
  specs: z.record(z.any()).optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(160).optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
})

export type ScooterFormData = z.infer<typeof scooterSchema>

export const partSchema = z.object({
  partName: z.string().min(1, 'Part name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.enum(['Engine', 'Brake', 'Electrical', 'Body', 'Accessories', 'Oil & Lubricants']),
  compatibleModel: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  minStock: z.number().int().min(0, 'Min stock cannot be negative').default(10),
  status: z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']),
  imageUrl: z.string().url().optional(),
})

export type PartFormData = z.infer<typeof partSchema>
