import { z } from 'zod'

export const appointmentStatusEnum = z.enum(['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export const appointmentCreateSchema = z.object({
  bikeModel: z.string().min(1, 'Bike model required'),
  bikeYear: z.number().optional(),
  registrationNumber: z.string().optional(),
  vin: z.string().optional(),
  mileage: z.number().optional(),
  description: z.string().optional(),
  customService: z.string().optional(),
  preferredDate: z.string().datetime(),
  preferredTime: z.string(),
})

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

export const appointmentRescheduleSchema = z.object({
  preferredDate: z.string().datetime(),
  preferredTime: z.string(),
})

export const appointmentStatusUpdateSchema = z.object({
  status: appointmentStatusEnum,
})

export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>
export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>
export type AppointmentReschedule = z.infer<typeof appointmentRescheduleSchema>
export type AppointmentStatusUpdate = z.infer<typeof appointmentStatusUpdateSchema>
