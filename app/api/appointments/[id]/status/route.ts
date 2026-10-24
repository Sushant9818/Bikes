import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { appointmentStatusUpdateSchema } from '@/lib/validations/appointment'
import { toAppointmentDto } from '@/lib/appointments'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = appointmentStatusUpdateSchema.parse(body)
    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Appointment not found')

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        status: data.status,
      },
      include: { services: true },
    })
    return NextResponse.json(toAppointmentDto(updated))
  } catch (err) {
    return handleApiError(err)
  }
}
