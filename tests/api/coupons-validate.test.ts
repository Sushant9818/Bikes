import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
  },
}))

const requireUserMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUserMock() }))

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { validateCoupon } from '@/lib/coupon-validation'
import { POST } from '@/app/api/coupons/validate/route'

type MockFn = ReturnType<typeof vi.fn>

function baseCoupon(overrides: Record<string, unknown> = {}) {
  return {
    code: 'SAVE10',
    description: null,
    isActive: true,
    expiryDate: null as Date | null,
    minAmount: null as number | null,
    maxUses: null as number | null,
    maxUsesPerUser: null as number | null,
    usesCount: 0,
    discountPercent: 10,
    discountFixed: null as number | null,
    ...overrides,
  }
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('validateCoupon (lib/coupon-validation)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('valid coupon with percentage discount calculates correct amount', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(
      baseCoupon({ discountPercent: 20, discountFixed: null })
    )
    const result = await validateCoupon('SAVE10', 200, 1)
    expect(result).toEqual({ valid: true, discountAmount: 40 })
  })

  it('valid coupon with fixed discount returns correct amount', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(
      baseCoupon({ code: 'FLAT50', discountPercent: 0, discountFixed: 50 })
    )
    const result = await validateCoupon('FLAT50', 500, 1)
    expect(result).toEqual({ valid: true, discountAmount: 50 })
  })

  it('normalizes code casing/whitespace before lookup', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon())
    await validateCoupon('  save10 ', 100, 1)
    expect(prisma.coupon.findUnique).toHaveBeenCalledWith({ where: { code: 'SAVE10' } })
  })

  it('coupon not found returns NOT_FOUND', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(null)
    const result = await validateCoupon('NOPE', 100, 1)
    expect(result).toEqual({ valid: false, reason: 'NOT_FOUND' })
  })

  it('inactive coupon returns NOT_FOUND', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ isActive: false }))
    const result = await validateCoupon('SAVE10', 100, 1)
    expect(result).toEqual({ valid: false, reason: 'NOT_FOUND' })
  })

  it('expired coupon returns EXPIRED', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(
      baseCoupon({ expiryDate: new Date('2020-01-01T00:00:00Z') })
    )
    const result = await validateCoupon('SAVE10', 100, 1)
    expect(result).toEqual({ valid: false, reason: 'EXPIRED' })
  })

  it('min amount not met returns MIN_AMOUNT_NOT_MET', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ minAmount: 1000 }))
    const result = await validateCoupon('SAVE10', 500, 1)
    expect(result).toEqual({ valid: false, reason: 'MIN_AMOUNT_NOT_MET' })
  })

  it('usage exhausted returns EXHAUSTED', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(
      baseCoupon({ maxUses: 5, usesCount: 5 })
    )
    const result = await validateCoupon('SAVE10', 100, 1)
    expect(result).toEqual({ valid: false, reason: 'EXHAUSTED' })
  })

  it('per-user limit reached returns USER_LIMIT_REACHED', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ maxUsesPerUser: 1 }))
    ;(prisma.order.count as MockFn).mockResolvedValue(1)

    const result = await validateCoupon('SAVE10', 100, 42)

    expect(result).toEqual({ valid: false, reason: 'USER_LIMIT_REACHED' })
    expect(prisma.order.count).toHaveBeenCalledWith({
      where: { userId: 42, couponCode: 'SAVE10' },
    })
  })

  it('per-user limit not yet reached still validates', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ maxUsesPerUser: 2 }))
    ;(prisma.order.count as MockFn).mockResolvedValue(1)

    const result = await validateCoupon('SAVE10', 100, 42)

    expect(result).toEqual({ valid: true, discountAmount: 10 })
  })

  it('precision: 10% of 999 = 99.90, not 100', async () => {
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ discountPercent: 10 }))
    const result = await validateCoupon('SAVE10', 999, 1)
    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(99.9)
    expect(result.discountAmount).not.toBe(100)
  })
})

describe('POST /api/coupons/validate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects unauthenticated callers', async () => {
    requireUserMock.mockRejectedValue(new ApiError(401, 'Not authenticated'))

    const res = await POST(makeRequest({ code: 'SAVE10', orderTotal: 100, userId: 1 }) as never)

    expect(res.status).toBe(401)
    expect(prisma.coupon.findUnique).not.toHaveBeenCalled()
  })

  it('returns 400 when required fields are missing', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })

    const res = await POST(makeRequest({ code: 'SAVE10' }) as never)

    expect(res.status).toBe(400)
  })

  it('returns valid:true with discountAmount for a valid coupon', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(baseCoupon({ discountPercent: 10 }))

    const res = await POST(makeRequest({ code: 'SAVE10', orderTotal: 999, userId: 1 }) as never)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ valid: true, discountAmount: 99.9 })
  })

  it('returns valid:false with reason for an invalid coupon', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })
    ;(prisma.coupon.findUnique as MockFn).mockResolvedValue(null)

    const res = await POST(makeRequest({ code: 'NOPE', orderTotal: 100, userId: 1 }) as never)
    const json = await res.json()

    expect(json).toEqual({ valid: false, reason: 'NOT_FOUND' })
  })
})
