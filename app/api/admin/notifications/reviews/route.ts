import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { sendNewReviewAlert } from '@/lib/email-service'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const recentReviews = await prisma.review.findMany({
      include: {
        user: { select: { username: true } },
        part: { select: { partName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({ reviews: recentReviews, count: recentReviews.length })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { reviewId, adminEmail } = await req.json()

    if (!reviewId || !adminEmail) {
      return NextResponse.json({ error: 'reviewId and adminEmail required' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { username: true } },
        part: { select: { partName: true } },
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await sendNewReviewAlert({
      adminEmail,
      reviewerName: review.user.username,
      partName: review.part.partName,
      rating: review.rating,
      title: review.title,
      content: review.content || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
