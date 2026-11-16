import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { vehicleInputSchema, vehicleTypeEnum } from '@/lib/validations/vehicle'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const typeParam = searchParams.get('type')
    const type = typeParam ? vehicleTypeEnum.parse(typeParam) : undefined
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort')

    const orderBy =
      sort === 'price_asc' ? { price: 'asc' as const } :
      sort === 'price_desc' ? { price: 'desc' as const } :
      { id: 'asc' as const }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        brand: 'Suzuki',
        ...(type ? { type } : {}),
        ...(q ? { modelName: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(minPrice || maxPrice
          ? { price: { ...(minPrice ? { gte: Number(minPrice) } : {}), ...(maxPrice ? { lte: Number(maxPrice) } : {}) } }
          : {}),
      },
      orderBy,
    })
    return NextResponse.json(vehicles)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = vehicleInputSchema.parse(body)
    const vehicle = await prisma.vehicle.create({ data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
