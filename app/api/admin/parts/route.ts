import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'

const createPartSchema = z.object({
  type: z.enum(['BIKE_PART', 'SCOOTER_PART']),
  partName: z.string().min(1, 'Part name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  compatibleModel: z.string().max(100).optional().nullable(),
  brand: z.string().default('Suzuki'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().nonnegative('Quantity must be non-negative').default(0),
  minStock: z.number().int().nonnegative('Min stock must be non-negative').default(10),
  imageUrl: z.string().url().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * pageSize

    const where: any = {}
    if (search) {
      where.OR = [
        { partName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type) {
      where.type = type
    }
    if (status) {
      where.status = status
    }

    const [data, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.part.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const validatedData = createPartSchema.parse(body)

    // Check if SKU already exists
    const existing = await prisma.part.findUnique({
      where: { sku: validatedData.sku },
    })

    if (existing) {
      throw new ApiError(409, 'Part with this SKU already exists')
    }

    const part = await prisma.part.create({
      data: {
        ...validatedData,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'CREATE',
        entityType: 'PART',
        entityId: part.id,
        changes: {
          created: true,
          ...validatedData,
        },
      },
    })

    return NextResponse.json(part, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
