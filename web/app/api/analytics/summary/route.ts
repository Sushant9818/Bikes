import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const toParam = searchParams.get('to')
    const fromParam = searchParams.get('from')
    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
    const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000)

    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID', createdAt: { gte: from, lt: toExclusive } },
      include: { items: true },
    })

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalOrders = paidOrders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const partTotals = new Map<string, { qtySold: number; revenue: number }>()
    for (const order of paidOrders) {
      for (const item of order.items) {
        const existing = partTotals.get(item.partName) ?? { qtySold: 0, revenue: 0 }
        existing.qtySold += item.quantity
        existing.revenue += item.price * item.quantity
        partTotals.set(item.partName, existing)
      }
    }
    const topParts = [...partTotals.entries()]
      .map(([partName, v]) => ({ partName, qtySold: v.qtySold, revenue: v.revenue }))
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 10)

    const dayMap = new Map<string, { count: number; revenue: number }>()
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      dayMap.set(d.toISOString().slice(0, 10), { count: 0, revenue: 0 })
    }
    for (const order of paidOrders) {
      const key = order.createdAt.toISOString().slice(0, 10)
      const existing = dayMap.get(key)
      if (existing) {
        existing.count += 1
        existing.revenue += order.totalAmount
      }
    }
    const ordersByDay = [...dayMap.entries()].map(([date, v]) => ({ date, count: v.count, revenue: v.revenue }))

    const lowStockPartsRaw = await prisma.part.findMany({ where: { brand: 'Suzuki', quantity: { lte: 5 } } })
    const lowStockParts = lowStockPartsRaw.map((p) => ({ partName: p.partName, quantity: p.quantity }))

    return NextResponse.json({ totalRevenue, totalOrders, avgOrderValue, topParts, ordersByDay, lowStockParts })
  } catch (err) {
    return handleApiError(err)
  }
}
