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
    const minAmount = parseFloat(searchParams.get('minAmount') || '0')
    const maxAmount = parseFloat(searchParams.get('maxAmount') || '999999')
    const sortBy = searchParams.get('sortBy') || 'id'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * pageSize

    const where: any = {}

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = { in: status.split(',') }
    }

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) }
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
    }

    where.totalAmount = { gte: minAmount, lte: maxAmount }

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    })

    const total = await prisma.order.count({ where })

    return NextResponse.json({
      orders,
      total,
      page,
      pageSize,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
