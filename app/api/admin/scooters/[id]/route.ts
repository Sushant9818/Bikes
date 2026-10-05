import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { scooterSchema } from '@/lib/admin/validations'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const scooter = await prisma.vehicle.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!scooter) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    return NextResponse.json(scooter)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin()
    const body = await req.json()
    const validated = scooterSchema.parse(body)

    const existing = await prisma.vehicle.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    const updated = await prisma.vehicle.update({
      where: { id: parseInt(params.id) },
      data: validated,
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin()

    const existing = await prisma.vehicle.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scooter not found' }, { status: 404 })
    }

    await prisma.vehicle.delete({
      where: { id: parseInt(params.id) },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_SCOOTER',
        entityType: 'Vehicle',
        entityId: parseInt(params.id),
        changes: { before: existing },
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
