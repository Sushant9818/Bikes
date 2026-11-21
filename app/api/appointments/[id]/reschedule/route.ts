import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { appointmentRescheduleSchema } from '@/lib/validations/appointment'
import { sendAppointmentConfirmationEmail } from '@/lib/email'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()
    const data = appointmentRescheduleSchema.parse(body)

    const appointmentId = parseInt(id)
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { services: true },
    })

    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.userId !== user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    const dateObj = new Date(data.preferredDate)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    // Check if new slot is available (exclude current appointment from check)
    const conflict = await prisma.appointment.findFirst({
      where: {
        preferredDate: dateObj,
        preferredTime: data.preferredTime,
        status: { not: 'CANCELLED' },
        id: { not: appointmentId },
      },
    })

    if (conflict) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please select a different date or time.' },
        { status: 409 }
      )
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        preferredDate: dateObj,
        preferredTime: data.preferredTime,
      },
      include: { services: true },
    })

    // Send confirmation email
    if (user.email) {
      await sendAppointmentConfirmationEmail(updated, user.email).catch(
        (err) => console.error('Failed to send reschedule confirmation email:', err)
      )
    }

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}
