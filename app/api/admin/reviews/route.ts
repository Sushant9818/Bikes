import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const page = req.nextUrl.searchParams.get('page') ? parseInt(req.nextUrl.searchParams.get('page')!) : 1
    const pageSize = 10
    const partId = req.nextUrl.searchParams.get('partId')

    const where: any = {}
    if (partId) where.partId = parseInt(partId)

    const total = await prisma.review.count({ where })
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { username: true, email: true, avatar: true } },
        part: { select: { id: true, partName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const stats = await prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: true,
    })

    const ratingStats = stats.reduce((acc, s) => {
      acc[s.rating] = s._count
      return acc
    }, {} as Record<number, number>)

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        total,
        averageRating: total > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
          : 0,
        ratingDistribution: ratingStats,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
