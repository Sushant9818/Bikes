import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { offerInputSchema } from '@/lib/validations/offer'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const offer = await prisma.offer.findUnique({ where: { id: Number(id) } })
    if (!offer) throw new ApiError(404, 'Offer not found')
    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = offerInputSchema.parse(body)
    const existing = await prisma.offer.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Offer not found')
    const offer = await prisma.offer.update({
      where: { id: Number(id) },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })
    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.offer.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Offer not found')
    await prisma.offer.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
