import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { appointmentStatusEnum } from '@/lib/validations/appointment'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  id: z.number(),
  status: appointmentStatusEnum,
})

export async function PATCH(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const body = await req.json()
    const validated = statusUpdateSchema.parse(body)

    const appointment = await prisma.appointment.findUnique({
      where: { id: validated.id },
    })

    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    }

    // Validate workflow
    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'CANCELLED'],
      APPROVED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: ['CANCELLED'],
      CANCELLED: [],
    }

    if (!validTransitions[appointment.status].includes(validated.status)) {
      return NextResponse.json(
        { message: `Cannot change status from ${appointment.status} to ${validated.status}` },
        { status: 400 }
      )
    }

    const updated = await prisma.appointment.update({
      where: { id: validated.id },
      data: { status: validated.status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}
