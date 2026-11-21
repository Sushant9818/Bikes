import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')?.trim() || ''
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : 0
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : Infinity
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : 0
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const pageSize = 12

    const where: any = {
      status: 'ACTIVE',
    }

    // Text search
    if (query) {
      where.OR = [
        { partName: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category && category !== 'ALL') {
      where.type = category
    }

    // Price filter
    if (minPrice > 0 || maxPrice !== Infinity) {
      where.price = {
        gte: minPrice,
        lte: maxPrice,
      }
    }

    // Get total count
    const total = await prisma.part.count({ where })

    // Get parts
    const parts = await prisma.part.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate average rating
    const partsWithRating = parts.map((part) => {
      const avgRating = part.reviews.length > 0
        ? part.reviews.reduce((sum, r) => sum + r.rating, 0) / part.reviews.length
        : 0

      // Filter by rating if specified
      if (minRating > 0 && avgRating < minRating) {
        return null
      }

      return {
        ...part,
        averageRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: part.reviews.length,
        reviews: undefined,
      }
    }).filter(Boolean)

    const totalPages = Math.ceil(partsWithRating.length > 0 ? total / pageSize : 0)

    return NextResponse.json({
      parts: partsWithRating,
      pagination: {
        page,
        pageSize,
        total: partsWithRating.length,
        totalPages,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
