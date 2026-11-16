import { z } from 'zod'

export const testDriveInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().max(100).optional().nullable(),
  vehicleId: z.number().int().positive().optional().nullable(),
  preferredDate: z.string().optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
})

export type TestDriveInput = z.infer<typeof testDriveInputSchema>
