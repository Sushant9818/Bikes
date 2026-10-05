import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'

const updateBikeSchema = z.object({
  modelName: z.string().min(1).optional(),
  brand: z.string().optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional().nullable(),
  year: z.number().int().optional().nullable(),
  quantity: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional().nullable(),
  images: z.array(z.string()).optional(),
  description: z.string().optional().nullable(),
  colors: z.array(z.string()).optional(),
  category: z.string().optional().nullable(),
  specs: z.record(z.any()).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin()
    const id = parseInt(params.id)

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid bike ID')
    }

    const bike = await prisma.vehicle.findUnique({ where: { id } })
    if (!bike) {
      throw new ApiError(404, 'Bike not found')
    }

    const body = await request.json()
    const validatedData = updateBikeSchema.parse(body)

    // Check if modelName already exists (excluding current bike)
    if (validatedData.modelName && validatedData.modelName !== bike.modelName) {
      const existing = await prisma.vehicle.findFirst({
        where: {
          modelName: validatedData.modelName,
          id: { not: id },
        },
      })
      if (existing) {
        throw new ApiError(409, 'Bike model already exists')
      }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: validatedData,
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'UPDATE',
        entityType: 'VEHICLE',
        entityId: id,
        changes: validatedData,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin()
    const id = parseInt(params.id)

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid bike ID')
    }

    const bike = await prisma.vehicle.findUnique({ where: { id } })
    if (!bike) {
      throw new ApiError(404, 'Bike not found')
    }

    await prisma.vehicle.delete({ where: { id } })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'DELETE',
        entityType: 'VEHICLE',
        entityId: id,
        changes: {
          modelName: bike.modelName,
          price: bike.price,
        },
      },
    })

    return NextResponse.json({ message: 'Bike deleted successfully' })
  } catch (err) {
    return handleApiError(err)
  }
}
