import { z } from 'zod'

export const orderStatusEnum = z.enum(['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'])
export const orderStatusUpdateSchema = z.object({
  status: orderStatusEnum,
})

export type OrderStatus = z.infer<typeof orderStatusEnum>
export type OrderStatusUpdate = z.infer<typeof orderStatusUpdateSchema>
