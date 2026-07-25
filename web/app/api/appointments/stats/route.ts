import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [todayCount, pendingCount, completedCount, inProgressCount, revenueAgg] = await Promise.all([
      prisma.appointment.count({ where: { preferredDate: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.appointment.aggregate({
        _sum: { finalCost: true },
        where: { status: 'COMPLETED', preferredDate: { gte: monthStart, lt: monthEnd } },
      }),
    ])

    return NextResponse.json({
      todayCount,
      pendingCount,
      completedCount,
      inProgressCount,
      monthlyRevenue: revenueAgg._sum.finalCost ?? 0,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
