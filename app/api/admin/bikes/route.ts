import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { bikeInputSchema } from '@/lib/validations/bike'
import { logBikeAction } from '@/lib/activity-log'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await req.json()
    const { specs, ...data } = bikeInputSchema.parse(body)

    const bike = await prisma.vehicle.create({
      data: {
        ...data,
        brand: 'Suzuki',
        ...(specs !== undefined ? { specs: specs as Prisma.InputJsonValue } : {}),
      },
    })

    // Log the creation
    await logBikeAction(user, 'CREATE', bike.id, { created: bike })

    return NextResponse.json(bike, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const skip = Number(searchParams.get('skip')) || 0
    const take = Number(searchParams.get('take')) || 10

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }

    const bikes = await prisma.vehicle.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.vehicle.count({ where })

    return NextResponse.json({
      bikes,
      total,
      skip,
      take,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
