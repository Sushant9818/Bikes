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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minOrders = parseInt(searchParams.get('minOrders') || '0')
    const maxOrders = parseInt(searchParams.get('maxOrders') || '9999')
    const minSpent = parseFloat(searchParams.get('minSpent') || '0')
    const maxSpent = parseFloat(searchParams.get('maxSpent') || '999999')

    const skip = (page - 1) * pageSize

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) }
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
    }

    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    })

    const total = await prisma.user.count({ where })

    // Calculate stats for each customer
    const customersWithStats = users.map(user => {
      const totalOrders = user.orders.length
      const totalSpent = user.orders.reduce((sum, o) => sum + o.totalAmount, 0)
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const lastOrderDate = user.orders.length > 0 ? user.orders[user.orders.length - 1].createdAt : null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        createdAt: user.createdAt,
        totalOrders,
        totalSpent,
        avgOrderValue,
        lastOrderDate,
      }
    })

    // Filter by order count and spent
    let filtered = customersWithStats.filter(c =>
      c.totalOrders >= minOrders &&
      c.totalOrders <= maxOrders &&
      c.totalSpent >= minSpent &&
      c.totalSpent <= maxSpent
    )

    return NextResponse.json({
      customers: filtered,
      total: filtered.length,
      page,
      pageSize,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
