import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()

    const [totalOrders, totalAppointments, totalReviews, totalWishlistItems] = await Promise.all([
      prisma.order.count({ where: { userId: user.id } }),
      prisma.appointment.count({ where: { userId: user.id } }),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.wishlist.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({
      totalOrders,
      totalAppointments,
      totalReviews,
      totalWishlistItems,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
