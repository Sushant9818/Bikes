import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { z } from 'zod'

const createReviewSchema = z.object({
  partId: z.number().int().positive('Part ID required'),
  rating: z.number().int().min(1, 'Min rating 1').max(5, 'Max rating 5'),
  title: z.string().min(1, 'Title required').max(100, 'Max 100 chars'),
  content: z.string().max(1000, 'Max 1000 chars').optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const data = createReviewSchema.parse(body)

    const part = await prisma.part.findUnique({ where: { id: data.partId } })
    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    const review = await prisma.review.upsert({
      where: { userId_partId: { userId: user.id, partId: data.partId } },
      update: {
        rating: data.rating,
        title: data.title,
        content: data.content || null,
      },
      create: {
        userId: user.id,
        partId: data.partId,
        rating: data.rating,
        title: data.title,
        content: data.content || null,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const partId = req.nextUrl.searchParams.get('partId')

    if (!partId) {
      return NextResponse.json({ error: 'partId required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { partId: parseInt(partId) },
      include: {
        user: {
          select: { username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: reviews.length,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
