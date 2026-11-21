import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { appointmentCreateSchema, appointmentStatusEnum } from '@/lib/validations/appointment'
import { toAppointmentDto } from '@/lib/appointments'
import { sendAppointmentConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const data = appointmentCreateSchema.parse(body)

    const dateObj = new Date(data.preferredDate)
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date format')
    }

    // Check if slot is already booked
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        preferredDate: dateObj,
        preferredTime: data.preferredTime,
        status: { not: 'CANCELLED' },
      },
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please select a different date or time.' },
        { status: 409 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        clientUsername: user.username,
        bikeModel: data.bikeModel,
        bikeYear: data.bikeYear ?? null,
        registrationNumber: data.registrationNumber ?? null,
        vin: data.vin ?? null,
        mileage: data.mileage ?? null,
        customService: data.customService ?? null,
        description: data.description ?? null,
        preferredDate: dateObj,
        preferredTime: data.preferredTime,
        status: 'APPROVED',
      },
      include: { services: true },
    })

    // Create service relationships if services provided
    if (data.services && data.services.length > 0) {
      for (const service of data.services) {
        await prisma.appointmentService.create({
          data: {
            appointmentId: appointment.id,
            service: service,
          },
        })
      }
    }

    // Fetch updated appointment with services
    const appointmentWithServices = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: { services: true },
    })

    // Send confirmation email
    if (appointmentWithServices && user.primaryEmailAddress?.emailAddress) {
      await sendAppointmentConfirmationEmail(appointmentWithServices, user.primaryEmailAddress.emailAddress).catch(
        (err) => console.error('Failed to send appointment confirmation email:', err)
      )
    }

    return NextResponse.json(toAppointmentDto(appointment), { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status')
    const status = statusParam ? appointmentStatusEnum.parse(statusParam) : undefined
    const date = searchParams.get('date')
    const client = searchParams.get('client')
    const bikeModel = searchParams.get('bikeModel')

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(date ? { preferredDate: new Date(date) } : {}),
        ...(client ? { clientUsername: { contains: client, mode: 'insensitive' as const } } : {}),
        ...(bikeModel ? { bikeModel: { contains: bikeModel, mode: 'insensitive' as const } } : {}),
      },
      include: { services: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(appointments.map(toAppointmentDto))
  } catch (err) {
    return handleApiError(err)
  }
}
