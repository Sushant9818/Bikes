import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { orderStatusUpdateSchema } from '@/lib/validations/order'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { status } = orderStatusUpdateSchema.parse(body)
    const existing = await prisma.order.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Order not found')
    const order = await prisma.order.update({ where: { id: Number(id) }, data: { status }, include: { items: true } })
    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}
