import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { partInputSchema, partTypeEnum } from '@/lib/validations/part'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const typeParam = searchParams.get('type')
    const type = typeParam ? partTypeEnum.parse(typeParam) : undefined
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : 0
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : Infinity
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : 0
    const sort = searchParams.get('sort')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100

    const orderBy =
      sort === 'price_asc' ? { price: 'asc' as const } :
      sort === 'price_desc' ? { price: 'desc' as const } :
      sort === 'price-low' ? { price: 'asc' as const } :
      sort === 'price-high' ? { price: 'desc' as const } :
      sort === 'popular' ? { _count: { orderItems: 'desc' as const } } :
      { id: 'asc' as const }

    const parts = await prisma.part.findMany({
      where: {
        brand: 'Suzuki',
        ...(type ? { type } : {}),
        ...(q
          ? { OR: [
              { partName: { contains: q, mode: 'insensitive' as const } },
              { sku: { contains: q, mode: 'insensitive' as const } },
              { compatibleModel: { contains: q, mode: 'insensitive' as const } },
            ] }
          : {}),
        price: { gte: minPrice, ...(maxPrice !== Infinity ? { lte: maxPrice } : {}) },
      },
      include: {
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy,
      take: limit,
    })

    // Filter by rating (in-memory)
    const filteredParts = parts.filter(part => {
      if (minRating === 0) return true
      if (part.reviews.length === 0) return false
      const avgRating = part.reviews.reduce((sum, r) => sum + r.rating, 0) / part.reviews.length
      return avgRating >= minRating
    })

    // Calculate ratings and remove internal fields
    const result = filteredParts.map(({ reviews, _count, ...part }) => ({
      ...part,
      avgRating: reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0,
      reviewCount: reviews.length,
      purchaseCount: _count.orderItems,
    }))

    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = partInputSchema.parse(body)
    const part = await prisma.part.create({ data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(part, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
