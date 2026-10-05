import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import {
  getKPIs,
  getMonthlyRevenue,
  getCategoryRevenue,
  getLowStockParts,
  getRecentAppointments,
} from '@/lib/admin/dashboard'

export async function GET() {
  try {
    await requireAdmin()

    const [kpis, monthlyRevenue, categoryRevenue, lowStockParts, recentAppointments] = await Promise.all([
      getKPIs(),
      getMonthlyRevenue(),
      getCategoryRevenue(),
      getLowStockParts(),
      getRecentAppointments(),
    ])

    return NextResponse.json({
      kpis,
      monthlyRevenue,
      categoryRevenue,
      lowStockParts,
      recentAppointments,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
