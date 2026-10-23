import { z } from 'zod'

export const orderStatusEnum = z.enum(['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'])

export const orderStatusUpdateSchema = z.object({
  status: orderStatusEnum,
})

export const createIntentSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone required'),
  address: z.string().min(1, 'Address required'),
  customerName: z.string().min(1, 'Name required'),
})

export type OrderStatus = z.infer<typeof orderStatusEnum>
export type OrderStatusUpdate = z.infer<typeof orderStatusUpdateSchema>
export type CreateIntent = z.infer<typeof createIntentSchema>
