import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { offerInputSchema } from '@/lib/validations/offer'

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({ orderBy: { id: 'desc' } })
    return NextResponse.json(offers)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = offerInputSchema.parse(body)
    const offer = await prisma.offer.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })
    return NextResponse.json(offer, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
