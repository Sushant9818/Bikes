import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { z } from 'zod'

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().max(1000).optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()
    const data = updateReviewSchema.parse(body)

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updated = await prisma.review.update({
      where: { id },
      data,
      include: {
        user: { select: { username: true, avatar: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.review.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
