import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { sendOrderConfirmation, sendOrderStatusUpdate } from '@/lib/email-service'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { orderId, type } = await req.json()

    if (!orderId || !type) {
      return NextResponse.json({ error: 'orderId and type required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { part: { select: { partName: true, price: true } } },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (type === 'confirmation') {
      await sendOrderConfirmation({
        customerEmail: order.email || '',
        customerName: order.customerName,
        orderId: order.id,
        items: order.items.map((item) => ({
          partName: item.part.partName,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: order.totalAmount,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
      })
    } else if (type === 'status-update') {
      await sendOrderStatusUpdate(order.email || '', order.customerName, order.id, order.status)
    }

    return NextResponse.json({ success: true, type, orderId })
  } catch (err) {
    return handleApiError(err)
  }
}
