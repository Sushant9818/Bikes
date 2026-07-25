import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { toAppointmentDto } from '@/lib/appointments'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params
    const appointment = await prisma.appointment.findUnique({ where: { id: Number(id) }, include: { services: true } })
    if (!appointment) throw new ApiError(404, 'Appointment not found')
    if (user.role !== 'ADMIN' && appointment.clientUsername !== user.username) throw new ApiError(403, 'Access denied')
    return NextResponse.json(toAppointmentDto(appointment))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Appointment not found')
    await prisma.appointment.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
