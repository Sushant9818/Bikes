import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { offerUpdateSchema } from '@/lib/validations/offer'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!offer) {
      return NextResponse.json({ message: 'Offer not found' }, { status: 404 })
    }

    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const body = await req.json()
    const validated = offerUpdateSchema.parse(body)

    const offer = await prisma.offer.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.discountPercent && { discountPercent: validated.discountPercent }),
        ...(validated.startDate && { startDate: new Date(validated.startDate) }),
        ...(validated.endDate && { endDate: new Date(validated.endDate) }),
        ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl }),
      },
    })

    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    await prisma.offer.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
