import { z } from 'zod'

export const appointmentStatusEnum = z.enum(['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export const appointmentUpdateSchema = z.object({
  bikeYear: z.number().optional().nullable(),
  vin: z.string().optional().nullable(),
  mileage: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  customService: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  finalCost: z.number().optional().nullable(),
  repairNotes: z.string().optional().nullable(),
  serviceNotes: z.string().optional().nullable(),
  mechanicName: z.string().optional().nullable(),
  status: appointmentStatusEnum.optional(),
})

export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>
