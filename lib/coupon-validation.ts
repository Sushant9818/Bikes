import { prisma } from '@/lib/prisma'

export type CouponInvalidReason =
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'MIN_AMOUNT_NOT_MET'
  | 'EXHAUSTED'
  | 'USER_LIMIT_REACHED'

export interface CouponValidationResult {
  valid: boolean
  discountAmount?: number
  reason?: CouponInvalidReason
}

/**
 * Validates a coupon code against an order total and a user, enforcing (in order):
 *   1. Existence + isActive
 *   2. Not expired
 *   3. Minimum order amount met
 *   4. Global usage limit not exhausted
 *   5. Per-user usage limit not exhausted (counted via Order.couponCode + Order.userId)
 *
 * On success, returns the calculated discount amount (rounded to 2 decimals for
 * percentage discounts).
 */
export async function validateCoupon(
  code: string,
  orderTotal: number,
  userId: number
): Promise<CouponValidationResult> {
  // Coupons are stored normalized (trimmed + uppercase) by the admin CRUD
  // endpoints — normalize the lookup the same way so callers can pass
  // whatever casing the customer typed.
  const normalizedCode = code.trim().toUpperCase()

  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } })

  if (!coupon || !coupon.isActive) {
    return { valid: false, reason: 'NOT_FOUND' }
  }

  if (coupon.expiryDate && coupon.expiryDate.getTime() <= Date.now()) {
    return { valid: false, reason: 'EXPIRED' }
  }

  if (coupon.minAmount != null && orderTotal < coupon.minAmount) {
    return { valid: false, reason: 'MIN_AMOUNT_NOT_MET' }
  }

  if (coupon.maxUses != null && coupon.usesCount >= coupon.maxUses) {
    return { valid: false, reason: 'EXHAUSTED' }
  }

  if (coupon.maxUsesPerUser != null) {
    const userUsageCount = await prisma.order.count({
      where: { userId, couponCode: coupon.code },
    })
    if (userUsageCount >= coupon.maxUsesPerUser) {
      return { valid: false, reason: 'USER_LIMIT_REACHED' }
    }
  }

  let discountAmount = 0
  if (coupon.discountPercent) {
    discountAmount = Math.round(orderTotal * (coupon.discountPercent / 100) * 100) / 100
  } else if (coupon.discountFixed) {
    discountAmount = coupon.discountFixed
  }

  discountAmount = Math.max(0, discountAmount)

  return { valid: true, discountAmount }
}
