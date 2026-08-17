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
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort')

    const orderBy =
      sort === 'price_asc' ? { price: 'asc' as const } :
      sort === 'price_desc' ? { price: 'desc' as const } :
      { id: 'asc' as const }

    const parts = await prisma.part.findMany({
      where: {
        brand: 'Suzuki',
        ...(type ? { type } : {}),
        ...(q
          ? { OR: [
              { partName: { contains: q, mode: 'insensitive' as const } },
              { compatibleModel: { contains: q, mode: 'insensitive' as const } },
            ] }
          : {}),
        ...(minPrice || maxPrice
          ? { price: { ...(minPrice ? { gte: Number(minPrice) } : {}), ...(maxPrice ? { lte: Number(maxPrice) } : {}) } }
          : {}),
      },
      orderBy,
    })
    return NextResponse.json(parts)
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
