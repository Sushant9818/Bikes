import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { orderStatusUpdateSchema } from '@/lib/validations/order'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    await prisma.order.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const body = await req.json()
    const validated = orderStatusUpdateSchema.parse(body)

    // Validate status workflow
    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Status workflow: PENDING→PAID→SHIPPED; CANCELLED from any
    const validTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'CANCELLED'],
      PAID: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['CANCELLED'],
      CANCELLED: [],
    }

    if (!validTransitions[order.status].includes(validated.status)) {
      return NextResponse.json(
        { message: `Cannot change status from ${order.status} to ${validated.status}` },
        { status: 400 }
      )
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: { status: validated.status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}
