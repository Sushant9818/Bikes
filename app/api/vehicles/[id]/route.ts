import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { vehicleInputSchema } from '@/lib/validations/vehicle'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!vehicle) throw new ApiError(404, 'Vehicle not found')
    return NextResponse.json(vehicle)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = vehicleInputSchema.parse(body)
    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Vehicle not found')
    const vehicle = await prisma.vehicle.update({ where: { id: Number(id) }, data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(vehicle)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Vehicle not found')
    await prisma.vehicle.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
