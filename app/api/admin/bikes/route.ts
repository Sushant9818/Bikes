import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'

const createBikeSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  brand: z.string().default('Suzuki'),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive().optional().nullable(),
  year: z.number().int().optional().nullable(),
  quantity: z.number().int().nonnegative('Quantity must be non-negative').default(0),
  imageUrl: z.string().url().optional().nullable(),
  images: z.array(z.string()).default([]),
  description: z.string().optional().nullable(),
  colors: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  specs: z.record(z.any()).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * pageSize

    const where: any = { type: 'BIKE' }
    if (search) {
      where.modelName = { contains: search, mode: 'insensitive' }
    }
    if (status) {
      where.status = status
    }

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicle.count({ where }),
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
    const validatedData = createBikeSchema.parse(body)

    // Check if model name already exists
    const existing = await prisma.vehicle.findUnique({
      where: { modelName: validatedData.modelName },
    })

    if (existing) {
      throw new ApiError(409, 'Bike model already exists')
    }

    const bike = await prisma.vehicle.create({
      data: {
        type: 'BIKE',
        ...validatedData,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'CREATE',
        entityType: 'VEHICLE',
        entityId: bike.id,
        changes: {
          created: true,
          ...validatedData,
        },
      },
    })

    return NextResponse.json(bike, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
