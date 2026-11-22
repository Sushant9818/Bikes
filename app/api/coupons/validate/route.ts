import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { validateCoupon } from '@/lib/coupon-validation'

// Note: this codebase's auth helper is `requireUser()` (lib/auth.ts) — there
// is no `requireAuth()` export. It throws ApiError(401) when unauthenticated,
// which `handleApiError` below converts into a 401 JSON response.
export async function POST(request: NextRequest) {
  try {
    await requireUser()

    const body = await request.json().catch(() => null)
    const { code, orderTotal, userId } = body ?? {}

    if (!code || typeof code !== 'string') {
      throw new ApiError(400, 'code is required')
    }
    if (typeof orderTotal !== 'number' || !Number.isFinite(orderTotal) || orderTotal < 0) {
      throw new ApiError(400, 'orderTotal must be a non-negative number')
    }
    if (typeof userId !== 'number' || !Number.isFinite(userId)) {
      throw new ApiError(400, 'userId is required')
    }

    const result = await validateCoupon(code, orderTotal, userId)

    // Spec allows either a 400 for invalid coupons or a 200 with `valid:
    // false` — this is a normal business outcome (not a malformed request),
    // so we use 200 for both valid and invalid results and let the body's
    // `valid` field carry the signal.
    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err)
  }
}
