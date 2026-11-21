import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { sendAppointmentReminder } from '@/lib/email-service'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { appointmentId } = await req.json()

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: { select: { email: true, username: true } },
        services: { select: { service: true } },
      },
    })

    if (!appointment || !appointment.user) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (!appointment.user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const appointmentDate = new Date(appointment.preferredDate).toLocaleDateString()
    const serviceNames = appointment.services.map((s) => s.service).join(', ')

    await sendAppointmentReminder({
      customerEmail: appointment.user.email,
      customerName: appointment.user.username,
      appointmentId: appointment.id,
      bikeModel: appointment.bikeModel,
      appointmentDate,
      appointmentTime: appointment.preferredTime,
      services: appointment.services.map((s) => s.service),
    })

    return NextResponse.json({ success: true, appointmentId })
  } catch (err) {
    return handleApiError(err)
  }
}
