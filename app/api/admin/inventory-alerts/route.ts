import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const lowStockParts = await prisma.part.findMany({
      where: {
        status: 'ACTIVE',
        quantity: {
          lte: prisma.part.fields.minStock,
        },
      },
      select: {
        id: true,
        partName: true,
        sku: true,
        quantity: true,
        minStock: true,
        price: true,
        type: true,
      },
      orderBy: [
        { quantity: 'asc' },
        { partName: 'asc' },
      ],
    })

    // Manual filtering since Prisma doesn't support field comparison in where
    const filtered = await prisma.part.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        partName: true,
        sku: true,
        quantity: true,
        minStock: true,
        price: true,
        type: true,
      },
    })

    const alertParts = filtered.filter((p) => p.quantity <= p.minStock)

    const stats = {
      totalLowStock: alertParts.length,
      outOfStock: alertParts.filter((p) => p.quantity === 0).length,
      criticallyLow: alertParts.filter((p) => p.quantity <= (p.minStock / 2)).length,
    }

    return NextResponse.json({
      parts: alertParts.sort((a, b) => a.quantity - b.quantity),
      stats,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { partId, quantity } = await req.json()

    if (!partId || quantity === undefined) {
      return NextResponse.json({ error: 'partId and quantity required' }, { status: 400 })
    }

    const updated = await prisma.part.update({
      where: { id: partId },
      data: { quantity },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}
