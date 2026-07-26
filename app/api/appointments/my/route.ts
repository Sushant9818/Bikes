import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { toAppointmentDto } from '@/lib/appointments'

export async function GET() {
  try {
    const user = await requireUser()
    const appointments = await prisma.appointment.findMany({
      where: { clientUsername: user.username },
      include: { services: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(appointments.map(toAppointmentDto))
  } catch (err) {
    return handleApiError(err)
  }
}
