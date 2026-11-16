import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { appointmentUpdateSchema } from '@/lib/validations/appointment'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const { id } = await params
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        services: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const { id } = await params
    const body = await req.json()
    const validated = appointmentUpdateSchema.parse(body)

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        ...(validated.bikeYear !== undefined && { bikeYear: validated.bikeYear }),
        ...(validated.vin !== undefined && { vin: validated.vin }),
        ...(validated.mileage !== undefined && { mileage: validated.mileage }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.customService !== undefined && { customService: validated.customService }),
        ...(validated.estimatedCost !== undefined && { estimatedCost: validated.estimatedCost }),
        ...(validated.finalCost !== undefined && { finalCost: validated.finalCost }),
        ...(validated.repairNotes !== undefined && { repairNotes: validated.repairNotes }),
        ...(validated.serviceNotes !== undefined && { serviceNotes: validated.serviceNotes }),
        ...(validated.mechanicName !== undefined && { mechanicName: validated.mechanicName }),
        ...(validated.status && { status: validated.status }),
      },
    })

    return NextResponse.json(appointment)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const { id } = await params
    await prisma.appointment.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
