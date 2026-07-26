import { z } from 'zod'

export const orderItemInputSchema = z.object({
  partId: z.number().int().positive(),
  quantity: z.number().int().min(1),
})

export const createIntentSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().max(100).optional().nullable(),
  address: z.string().min(1, 'Address is required').max(500),
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required'),
})

export type CreateIntentInput = z.infer<typeof createIntentSchema>
export type OrderItemInput = z.infer<typeof orderItemInputSchema>

export const orderStatusEnum = z.enum(['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'PAYMENT_REVIEW', 'FAILED'])

export const orderStatusUpdateSchema = z.object({ status: orderStatusEnum })
