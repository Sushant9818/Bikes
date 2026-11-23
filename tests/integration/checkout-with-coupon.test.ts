import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mocks -----------------------------------------------------------------
// POST /api/orders authenticates via Clerk's `auth()` directly.
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// POST /api/coupons/validate authenticates via lib/auth's `requireUser()`.
const requireUserMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUserMock() }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    order: { create: vi.fn(), count: vi.fn() },
    coupon: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/pickup-code', () => ({
  generatePickupCode: vi.fn(() => 'PKP-20261123-0001'),
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { POST as validateCouponRoute } from '@/app/api/coupons/validate/route'
import { POST as createOrderRoute } from '@/app/api/orders/route'

type MockFn = ReturnType<typeof vi.fn>

function baseCoupon(overrides: Record<string, unknown> = {}) {
  return {
    code: 'SAVE10',
    description: null,
    isActive: true,
    expiryDate: null as Date | null,
    minAmount: null as number | null,
    maxUses: null as number | null,
    maxUsesPerUser: 1 as number | null,
    usesCount: 0,
    discountPercent: 10,
    discountFixed: null as number | null,
    ...overrides,
  }
}

function makeValidateRequest(body: unknown) {
  return new Request('http://localhost/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function makeOrderRequest(body: unknown) {
  return new NextRequest('http://localhost/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const orderPayload = (overrides: Record<string, unknown> = {}) => ({
  customerName: 'Jane Doe',
  phone: '9800000000',
  email: 'jane@example.com',
  address: 'Kathmandu',
  totalAmount: 1000,
  items: [{ partId: 10, partName: 'Air Filter', price: 500, quantity: 2 }],
  pickupLocation: 'Main Store',
  pickupTimeSlot: 'today-3-5pm',
  ...overrides,
})

describe('Checkout integration: coupon applied at validate-time, persisted at order-creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as unknown as MockFn).mockResolvedValue({ userId: 'clerk-1' })
    ;(prisma.user.findUnique as MockFn).mockResolvedValue({ id: 1, clerkUserId: 'clerk-1' })
  })

  it('checkout flow: validate shows discount, order is created with couponCode + discountAmount persisted, usesCount incremented', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon())
    ;(prisma.order.count as MockFn).mockResolvedValue(0)

    // Step 1 — customer types the code into CouponInput; it hits /api/coupons/validate.
    const validateRes = await validateCouponRoute(
      makeValidateRequest({ code: 'SAVE10', orderTotal: 1000, userId: 1 }) as never
    )
    const validateBody = await validateRes.json()
    expect(validateBody).toEqual({ valid: true, discountAmount: 100 })

    // Step 2 — customer submits the order; checkout sends couponCode along with totalAmount.
    ;(prisma.order.create as MockFn).mockResolvedValue({
      id: 123,
      ...orderPayload(),
      status: 'PENDING',
      userId: 1,
      pickupCode: 'PKP-20261123-0001',
      estimatedPickupTime: new Date(),
      couponCode: 'SAVE10',
      discountAmount: 100,
      items: [],
    })
    ;(prisma.coupon.update as MockFn).mockResolvedValue(baseCoupon({ usesCount: 1 }))

    const orderRes = await createOrderRoute(
      makeOrderRequest(orderPayload({ couponCode: 'SAVE10' })) as never
    )

    expect(orderRes.status).toBe(201)

    // The API must re-validate and compute its own discount, not trust the client.
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          couponCode: 'SAVE10',
          discountAmount: 100,
        }),
      })
    )

    // Coupon usage must be incremented exactly once after order creation.
    expect(prisma.coupon.update).toHaveBeenCalledTimes(1)
    expect(prisma.coupon.update).toHaveBeenCalledWith({
      where: { code: 'SAVE10' },
      data: { usesCount: { increment: 1 } },
    })

    const orderBody = await orderRes.json()
    expect(orderBody).toHaveProperty('couponCode', 'SAVE10')
    expect(orderBody).toHaveProperty('discountAmount', 100)
  })

  it('does not trust a client-forged discountAmount: recomputes from the coupon record', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ discountPercent: 10 }))
    ;(prisma.order.count as MockFn).mockResolvedValue(0)
    ;(prisma.order.create as MockFn).mockResolvedValue({ id: 1, couponCode: 'SAVE10', discountAmount: 100 })

    // Client tries to pass an inflated discountAmount (e.g. tampered request).
    await createOrderRoute(
      makeOrderRequest(orderPayload({ couponCode: 'SAVE10', discountAmount: 99999 })) as never
    )

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ discountAmount: 100 }),
      })
    )
  })

  it('rejects order creation when the coupon fails re-validation at the API boundary (e.g. expired after client-side check)', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(
      baseCoupon({ expiryDate: new Date('2020-01-01T00:00:00Z') })
    )

    const res = await createOrderRoute(
      makeOrderRequest(orderPayload({ couponCode: 'SAVE10' })) as never
    )

    expect(res.status).toBe(400)
    expect(prisma.order.create).not.toHaveBeenCalled()
    expect(prisma.coupon.update).not.toHaveBeenCalled()
  })

  it('requires a signed-in user to redeem a coupon at order creation', async () => {
    ;(auth as unknown as MockFn).mockResolvedValue({ userId: null })

    const res = await createOrderRoute(
      makeOrderRequest(orderPayload({ couponCode: 'SAVE10' })) as never
    )

    expect(res.status).toBe(400)
    expect(prisma.order.create).not.toHaveBeenCalled()
    expect(prisma.coupon.findUnique).not.toHaveBeenCalled()
  })

  it('enforces the per-user usage limit: a second order with the same coupon by the same user is rejected', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ maxUsesPerUser: 1 }))

    // First order: user hasn't used this coupon before.
    ;(prisma.order.count as MockFn).mockResolvedValueOnce(0)
    ;(prisma.order.create as MockFn).mockResolvedValueOnce({
      id: 1,
      couponCode: 'SAVE10',
      discountAmount: 100,
    })
    ;(prisma.coupon.update as MockFn).mockResolvedValueOnce(baseCoupon({ usesCount: 1 }))

    const firstRes = await createOrderRoute(
      makeOrderRequest(orderPayload({ couponCode: 'SAVE10' })) as never
    )
    expect(firstRes.status).toBe(201)
    expect(prisma.order.create).toHaveBeenCalledTimes(1)

    // Second order: prisma.order.count now reflects the prior usage recorded against this user.
    ;(prisma.order.count as MockFn).mockResolvedValueOnce(1)

    const secondRes = await createOrderRoute(
      makeOrderRequest(orderPayload({ couponCode: 'SAVE10' })) as never
    )

    expect(secondRes.status).toBe(400)
    const secondBody = await secondRes.json()
    expect(secondBody).toHaveProperty('reason', 'USER_LIMIT_REACHED')

    // No second order or coupon increment should have happened.
    expect(prisma.order.create).toHaveBeenCalledTimes(1)
    expect(prisma.coupon.update).toHaveBeenCalledTimes(1)
  })
})
