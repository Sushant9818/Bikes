import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { generatePickupCode } from '@/lib/pickup-code'
import { validateCoupon } from '@/lib/coupon-validation'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's orders
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    return handleApiError(err)
  }
}

function getEstimatedPickupTime(slotId: string): Date {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()

  if (slotId === 'today-3-5pm') {
    return new Date(year, month, date, 15, 0)
  }
  if (slotId === 'today-5-7pm') {
    return new Date(year, month, date, 17, 0)
  }
  if (slotId === 'tomorrow-10-12pm') {
    return new Date(year, month, date + 1, 10, 0)
  }
  if (slotId === 'tomorrow-2-4pm') {
    return new Date(year, month, date + 1, 14, 0)
  }
  return now
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await req.json()

    const {
      customerName,
      phone,
      email,
      address,
      totalAmount,
      items,
      pickupLocation,
      pickupTimeSlot,
      couponCode,
    } = body

    if (!customerName || !phone || !address || !totalAmount || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const pickupCode = generatePickupCode(Date.now(), new Date())
    const estimatedPickupTime = getEstimatedPickupTime(pickupTimeSlot || '')

    const user = userId
      ? await prisma.user.findUnique({
          where: { clerkUserId: userId },
        })
      : null

    // Re-validate the coupon at the API boundary instead of trusting the
    // discountAmount the client sent with checkout — the client-side
    // CouponInput check happens earlier and the coupon's state (uses,
    // expiry, per-user limit) can change between validation and submit.
    let finalCouponCode: string | null = null
    let finalDiscountAmount: number | null = null

    if (couponCode) {
      if (!user) {
        return NextResponse.json(
          { error: 'You must be signed in to use a coupon code' },
          { status: 400 }
        )
      }

      const validation = await validateCoupon(couponCode, totalAmount, user.id)

      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Coupon is no longer valid', reason: validation.reason },
          { status: 400 }
        )
      }

      finalCouponCode = couponCode.trim().toUpperCase()
      finalDiscountAmount = validation.discountAmount ?? 0
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        email: email || null,
        address,
        totalAmount,
        status: 'PENDING',
        userId: user?.id || null,
        items: {
          create: items.map((item: any) => ({
            partId: item.partId,
            partName: item.partName,
            price: item.price,
            quantity: item.quantity,
          })),
        },
        pickupLocation: pickupLocation || null,
        pickupCode,
        estimatedPickupTime,
        couponCode: finalCouponCode,
        discountAmount: finalDiscountAmount,
      },
      include: { items: true },
    })

    if (finalCouponCode) {
      await prisma.coupon.update({
        where: { code: finalCouponCode },
        data: { usesCount: { increment: 1 } },
      })
    }

    return NextResponse.json(
      {
        orderId: order.id,
        pickupCode: order.pickupCode,
        estimatedPickupTime: order.estimatedPickupTime,
        pickupLocation: order.pickupLocation,
        couponCode: order.couponCode,
        discountAmount: order.discountAmount,
      },
      { status: 201 }
    )
  } catch (err) {
    return handleApiError(err)
  }
}
