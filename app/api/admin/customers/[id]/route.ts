import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { customerUpdateSchema } from '@/lib/validations/customer'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    // Calculate stats from paid orders only
    const paidOrders = user.orders.filter(o => o.status === 'PAID')
    const totalOrders = paidOrders.length
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    const lastOrderDate = paidOrders.length > 0 ? paidOrders[0].createdAt : null

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phoneNumber,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        totalOrders,
        totalSpent,
        avgOrderValue,
        lastOrderDate,
      },
      orders: user.orders,
    })
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
    const validated = customerUpdateSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.email && { email: validated.email }),
        ...(validated.phone !== undefined && { phoneNumber: validated.phone }),
        ...(validated.address !== undefined && { address: validated.address }),
      },
    })

    return NextResponse.json(user)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    await prisma.user.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
