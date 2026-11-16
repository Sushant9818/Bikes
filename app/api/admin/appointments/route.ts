import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 50)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const mechanicName = searchParams.get('mechanicName') || ''

    const skip = (page - 1) * pageSize

    const where: any = {}

    if (search) {
      where.OR = [
        { clientUsername: { contains: search, mode: 'insensitive' } },
        { bikeModel: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = { in: status.split(',') }
    }

    if (startDate) {
      where.preferredDate = { gte: new Date(startDate) }
    }

    if (endDate) {
      where.preferredDate = { ...where.preferredDate, lte: new Date(endDate) }
    }

    if (mechanicName) {
      where.mechanicName = { contains: mechanicName, mode: 'insensitive' }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id: 'desc' },
    })

    const total = await prisma.appointment.count({ where })

    return NextResponse.json({
      appointments,
      total,
      page,
      pageSize,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
