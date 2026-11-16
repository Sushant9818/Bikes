import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requireSuperAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { scooterSchema } from '@/lib/admin/validations'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const scooter = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) },
    })

    if (!scooter) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    return NextResponse.json(scooter)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { specs, ...validated } = scooterSchema.parse(body)

    const existing = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    const updated = await prisma.vehicle.update({
      where: { id: parseInt(id) },
      data: {
        ...validated,
        ...(specs !== undefined ? { specs: specs as Prisma.InputJsonValue } : {}),
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_SCOOTER',
        entityType: 'Vehicle',
        entityId: updated.id,
        changes: { before: existing, after: updated },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireSuperAdmin()
    const { id } = await params

    const existing = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    await prisma.vehicle.delete({
      where: { id: parseInt(id) },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_SCOOTER',
        entityType: 'Vehicle',
        entityId: parseInt(id),
        changes: { before: existing },
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
