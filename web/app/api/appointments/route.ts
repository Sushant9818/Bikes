import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { appointmentCreateSchema, appointmentStatusEnum } from '@/lib/validations/appointment'
import { toAppointmentDto } from '@/lib/appointments'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const data = appointmentCreateSchema.parse(body)

    const appointment = await prisma.appointment.create({
      data: {
        clientUsername: user.username,
        bikeModel: data.bikeModel,
        bikeYear: data.bikeYear ?? null,
        registrationNumber: data.registrationNumber ?? null,
        vin: data.vin ?? null,
        mileage: data.mileage ?? null,
        customService: data.customService ?? null,
        description: data.description ?? null,
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        status: 'PENDING',
        services: { create: data.services.map((service) => ({ service })) },
      },
      include: { services: true },
    })

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
