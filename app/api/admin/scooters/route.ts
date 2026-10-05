import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { scooterSchema } from '@/lib/admin/validations'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || 'id'
    const pageSize = 20

    const where: any = {
      type: 'SCOOTER',
      ...(search && {
        OR: [
          { modelName: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
    }

    const [scooters, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: getSortOrder(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vehicle.count({ where }),
    ])

    return NextResponse.json({
      data: scooters,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await req.json()
    const validated = scooterSchema.parse(body)

    const scooter = await prisma.vehicle.create({
      data: {
        type: 'SCOOTER',
        ...validated,
        brand: 'Suzuki',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_SCOOTER',
        entityType: 'Vehicle',
        entityId: scooter.id,
        changes: { after: scooter },
      },
    })

    return NextResponse.json(scooter, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

function getSortOrder(sort: string) {
  switch (sort) {
    case 'name_asc':
      return { modelName: 'asc' }
    case 'name_desc':
      return { modelName: 'desc' }
    case 'price_asc':
      return { price: 'asc' }
    case 'price_desc':
      return { price: 'desc' }
    case 'stock_asc':
      return { quantity: 'asc' }
    case 'stock_desc':
      return { quantity: 'desc' }
    default:
      return { id: 'asc' }
  }
}
