import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { bikeInputSchema } from '@/lib/validations/bike'
import { logBikeAction } from '@/lib/activity-log'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const bike = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
    })
    if (!bike) throw new ApiError(404, 'Bike not found')
    return NextResponse.json(bike)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = bikeInputSchema.parse(body)

    const existing = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
    })
    if (!existing) throw new ApiError(404, 'Bike not found')

    // Calculate changes for activity log
    const changes: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (JSON.stringify((existing as never)[key]) !== JSON.stringify(value)) {
        changes[key] = { from: (existing as never)[key], to: value }
      }
    }

    const bike = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: {
        ...data,
        brand: 'Suzuki',
      },
    })

    // Log the update
    await logBikeAction(user, 'UPDATE', bike.id, changes)

    return NextResponse.json(bike)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAdmin()
    const { id } = await params

    const existing = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
    })
    if (!existing) throw new ApiError(404, 'Bike not found')

    await prisma.vehicle.delete({
      where: { id: Number(id) },
    })

    // Log the deletion
    await logBikeAction(user, 'DELETE', Number(id), { deletedBike: existing })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
