import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'

const updatePartSchema = z.object({
  type: z.enum(['BIKE_PART', 'SCOOTER_PART']).optional(),
  partName: z.string().min(1, 'Part name is required').max(100).optional(),
  sku: z.string().min(1, 'SKU is required').max(50).optional(),
  compatibleModel: z.string().max(100).optional().nullable(),
  price: z.number().positive('Price must be positive').optional(),
  quantity: z.number().int().nonnegative('Quantity must be non-negative').optional(),
  minStock: z.number().int().nonnegative('Min stock must be non-negative').optional(),
  imageUrl: z.string().url().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params
    const partId = parseInt(id)

    if (isNaN(partId)) {
      throw new ApiError(400, 'Invalid part ID')
    }

    const part = await prisma.part.findUnique({
      where: { id: partId },
    })

    if (!part) {
      throw new ApiError(404, 'Part not found')
    }

    return NextResponse.json(part)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin()

    const { id } = await params
    const partId = parseInt(id)

    if (isNaN(partId)) {
      throw new ApiError(400, 'Invalid part ID')
    }

    const part = await prisma.part.findUnique({
      where: { id: partId },
    })

    if (!part) {
      throw new ApiError(404, 'Part not found')
    }

    const body = await request.json()
    const validatedData = updatePartSchema.parse(body)

    // Check if SKU already exists on another part
    if (validatedData.sku && validatedData.sku !== part.sku) {
      const existing = await prisma.part.findUnique({
        where: { sku: validatedData.sku },
      })
      if (existing) {
        throw new ApiError(409, 'Part with this SKU already exists')
      }
    }

    const updatedPart = await prisma.part.update({
      where: { id: partId },
      data: {
        ...validatedData,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'UPDATE',
        entityType: 'PART',
        entityId: partId,
        changes: validatedData,
      },
    })

    return NextResponse.json(updatedPart)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin()

    const { id } = await params
    const partId = parseInt(id)

    if (isNaN(partId)) {
      throw new ApiError(400, 'Invalid part ID')
    }

    const part = await prisma.part.findUnique({
      where: { id: partId },
    })

    if (!part) {
      throw new ApiError(404, 'Part not found')
    }

    await prisma.part.delete({
      where: { id: partId },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'DELETE',
        entityType: 'PART',
        entityId: partId,
        changes: {
          deleted: true,
          partName: part.partName,
          sku: part.sku,
        },
      },
    })

    return NextResponse.json({ message: 'Part deleted successfully' })
  } catch (err) {
    return handleApiError(err)
  }
}
