import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { appointmentRescheduleSchema } from '@/lib/validations/appointment'
import { toAppointmentDto } from '@/lib/appointments'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()
    const data = appointmentRescheduleSchema.parse(body)
    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Appointment not found')
    if (existing.clientUsername !== user.username) throw new ApiError(403, 'Access denied')
    if (existing.status !== 'PENDING') throw new ApiError(400, 'Only pending appointments can be rescheduled')

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        ...(data.bikeModel ? { bikeModel: data.bikeModel } : {}),
      },
      include: { services: true },
    })
    return NextResponse.json(toAppointmentDto(updated))
  } catch (err) {
    return handleApiError(err)
  }
}
