import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { couponUpdateSchema } from '@/lib/validations/coupon'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()

    const { id } = await params
    const couponId = parseInt(id)
    if (Number.isNaN(couponId)) {
      throw new ApiError(400, 'Invalid coupon id')
    }

    const body = await req.json()
    const validated = couponUpdateSchema.parse(body)

    const existingCoupon = await prisma.coupon.findUnique({ where: { id: couponId } })
    if (!existingCoupon) {
      throw new ApiError(404, 'Coupon not found')
    }

    const codeNormalized = validated.code.trim().toUpperCase()
    if (codeNormalized !== existingCoupon.code) {
      const conflict = await prisma.coupon.findUnique({ where: { code: codeNormalized } })
      if (conflict) {
        throw new ApiError(400, 'A coupon with this code already exists')
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: codeNormalized,
        description: validated.description?.trim() || null,
        // See app/api/admin/coupons/route.ts for why 0 means "no percent discount".
        discountPercent: validated.discountPercent ?? 0,
        discountFixed: validated.discountFixed ?? null,
        minAmount: validated.minAmount ?? null,
        maxUses: validated.maxUses ?? null,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        isActive: validated.isActive,
      },
    })

    return NextResponse.json(coupon)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()

    const { id } = await params
    const couponId = parseInt(id)
    if (Number.isNaN(couponId)) {
      throw new ApiError(400, 'Invalid coupon id')
    }

    const existingCoupon = await prisma.coupon.findUnique({ where: { id: couponId } })
    if (!existingCoupon) {
      throw new ApiError(404, 'Coupon not found')
    }

    await prisma.coupon.delete({ where: { id: couponId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
