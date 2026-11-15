import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { offerInputSchema } from '@/lib/validations/offer'

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 50)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const minDiscount = parseInt(searchParams.get('minDiscount') || '0')
    const maxDiscount = parseInt(searchParams.get('maxDiscount') || '100')
    const sortBy = searchParams.get('sortBy') || 'id'
    const sortOrder = searchParams.get('sortOrder') || 'asc' as 'asc' | 'desc'

    const skip = (page - 1) * pageSize

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const allOffers = await prisma.offer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    })

    // Calculate status for each offer
    const calculateStatus = (offer: any) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const start = new Date(offer.startDate)
      const end = new Date(offer.endDate)

      if (today < start) return 'UPCOMING'
      if (today > end) return 'EXPIRED'
      return 'ACTIVE'
    }

    let offersWithStatus = allOffers.map(o => ({
      ...o,
      calculatedStatus: calculateStatus(o),
    }))

    // Filter by status
    if (status) {
      const statuses = status.split(',')
      offersWithStatus = offersWithStatus.filter(o => statuses.includes(o.calculatedStatus))
    }

    // Filter by discount range
    offersWithStatus = offersWithStatus.filter(o =>
      (o.discountPercent ?? 0) >= minDiscount && (o.discountPercent ?? 0) <= maxDiscount
    )

    const total = offersWithStatus.length
    const paginated = offersWithStatus.slice(skip, skip + pageSize)

    return NextResponse.json({
      offers: paginated,
      total,
      page,
      pageSize,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const body = await req.json()
    console.log('[Offer API] Received body:', JSON.stringify(body, null, 2))

    const validated = offerInputSchema.parse(body)
    console.log('[Offer API] Validation passed:', JSON.stringify(validated, null, 2))

    // Extract just the date part (YYYY-MM-DD) for @db.Date fields
    const parseDate = (dateStr: string) => {
      if (!dateStr) return null
      const date = new Date(dateStr)
      console.log(`[Offer API] Parsed date "${dateStr}" to:`, date)
      return date
    }

    const startDate = parseDate(validated.startDate)
    const endDate = parseDate(validated.endDate)

    console.log('[Offer API] About to create offer with data:', {
      title: validated.title.trim(),
      description: validated.description?.trim() || null,
      discountPercent: validated.discountPercent,
      startDate,
      endDate,
      imageUrl: validated.imageUrl || null,
    })

    const offer = await prisma.offer.create({
      data: {
        title: validated.title.trim(),
        description: validated.description?.trim() || null,
        discountPercent: validated.discountPercent,
        startDate,
        endDate,
        imageUrl: validated.imageUrl || null,
      },
    })

    console.log('[Offer API] Successfully created offer:', offer)
    return NextResponse.json(offer, { status: 201 })
  } catch (err) {
    console.error('[Offer API] Error:', err)
    if (err instanceof Error) {
      console.error('[Offer API] Error message:', err.message)
      console.error('[Offer API] Error stack:', err.stack)
    }
    return handleApiError(err)
  }
}
