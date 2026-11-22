import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { couponInputSchema } from '@/lib/validations/coupon'

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const skip = (page - 1) * PAGE_SIZE

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.coupon.count(),
    ])

    return NextResponse.json({ coupons, total, page })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const validated = couponInputSchema.parse(body)

    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code.trim().toUpperCase() },
    })
    if (existing) {
      throw new ApiError(400, 'A coupon with this code already exists')
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code.trim().toUpperCase(),
        description: validated.description?.trim() || null,
        // discountPercent is NOT NULL in the schema; 0 represents "no percent
        // discount" when a fixed discount is used instead (same convention as
        // app/api/coupons/validate/route.ts, which treats a falsy
        // discountPercent as "use discountFixed").
        discountPercent: validated.discountPercent ?? 0,
        discountFixed: validated.discountFixed ?? null,
        minAmount: validated.minAmount ?? null,
        maxUses: validated.maxUses ?? null,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        isActive: validated.isActive,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
