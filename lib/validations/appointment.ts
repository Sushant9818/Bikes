import { z } from 'zod'

export const serviceTypeEnum = z.enum([
  'OIL_CHANGE', 'ENGINE_REPAIR', 'TIRE_REPLACEMENT', 'BRAKE_SERVICE', 'BATTERY_REPLACEMENT',
  'CHAIN_ADJUSTMENT', 'CHAIN_REPLACEMENT', 'SUSPENSION_REPAIR', 'ELECTRICAL_REPAIR', 'GENERAL_INSPECTION',
  'FULL_SERVICE', 'CLUTCH_REPAIR', 'GEAR_REPAIR', 'COOLING_SYSTEM_REPAIR', 'FUEL_SYSTEM_CLEANING',
  'AIR_FILTER_REPLACEMENT', 'SPARK_PLUG_REPLACEMENT', 'WHEEL_ALIGNMENT', 'WASHING_DETAILING', 'OTHER',
])

export const appointmentStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export const appointmentCreateSchema = z.object({
  bikeModel: z.string().min(1, 'Bike model is required').max(100),
  bikeYear: z.number().int().min(1980).max(2100).optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  services: z.array(serviceTypeEnum).min(1, 'At least one service must be selected'),
  customService: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
})

export const appointmentStatusUpdateSchema = z.object({
  status: appointmentStatusEnum,
  repairNotes: z.string().optional().nullable(),
  serviceNotes: z.string().optional().nullable(),
  mechanicName: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  finalCost: z.number().optional().nullable(),
})

export const appointmentRescheduleSchema = z.object({
  bikeModel: z.string().optional(),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
})

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>
export type AppointmentStatusUpdateInput = z.infer<typeof appointmentStatusUpdateSchema>
export type AppointmentRescheduleInput = z.infer<typeof appointmentRescheduleSchema>
