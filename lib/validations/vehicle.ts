import { z } from 'zod'

export const vehicleTypeEnum = z.enum(['BIKE', 'SCOOTER'])

export const vehicleInputSchema = z.object({
  type: vehicleTypeEnum,
  modelName: z.string().min(1, 'Model name is required').max(100),
  year: z.number().int().min(1900).max(2100),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  imageUrl: z.string().max(500).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
})

export type VehicleInput = z.infer<typeof vehicleInputSchema>
