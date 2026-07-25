import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import type { User, Order, OrderItem } from '@prisma/client'
import type { OrderItemInput } from '@/lib/validations/order'

export async function createOrderDraft(
  user: User,
  customerName: string,
  phone: string,
  email: string | null,
  address: string,
  items: OrderItemInput[]
): Promise<Order & { items: OrderItem[] }> {
  return prisma.$transaction(async (tx) => {
    let totalAmount = 0
    const itemsData: { partId: number; partName: string; price: number; quantity: number }[] = []

    for (const item of items) {
      const part = await tx.part.findUnique({ where: { id: item.partId } })
      if (!part) throw new ApiError(404, `Part not found: ${item.partId}`)
      if (part.quantity < item.quantity) throw new ApiError(400, `Insufficient stock for part: ${part.partName}`)
      totalAmount += part.price * item.quantity
      itemsData.push({ partId: part.id, partName: part.partName, price: part.price, quantity: item.quantity })
    }

    return tx.order.create({
      data: {
        customerName,
        phone,
        email,
        address,
        totalAmount,
        status: 'PENDING',
        userId: user.id,
        items: { create: itemsData },
      },
      include: { items: true },
    })
  })
}

class InsufficientStockError extends Error {
  partName: string
  constructor(partName: string) {
    super(`Insufficient stock for part: ${partName}`)
    this.partName = partName
  }
}

export async function finalizeOrder(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) throw new ApiError(404, 'Order not found')
  if (order.status === 'PAID') return

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } })
      if (!current || current.status === 'PAID') return

      for (const item of order.items) {
        const result = await tx.part.updateMany({
          where: { id: item.partId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        })
        if (result.count === 0) {
          const part = await tx.part.findUnique({ where: { id: item.partId } })
          throw new InsufficientStockError(part?.partName ?? `part ${item.partId}`)
        }
      }

      await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } })
    })
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'PAYMENT_REVIEW' } })
      throw new ApiError(409, `Insufficient stock for part: ${err.partName} after payment`)
    }
    throw err
  }
}

export async function setStripePaymentIntentId(orderId: number, paymentIntentId: string): Promise<void> {
  await prisma.order.update({ where: { id: orderId }, data: { stripePaymentIntentId: paymentIntentId } })
}

export async function findOrderByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  return prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
}
