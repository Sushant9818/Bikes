'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface CouponInputProps {
  /** Current cart/order total, used to validate minimum order amount rules. */
  orderTotal: number
  /** Called whenever the applied discount changes so the parent can recompute the order total. */
  onDiscountChange: (discountAmount: number | null) => void
  /** Optional: called whenever the applied coupon code changes (null when removed/invalid), so the parent can submit it with the order. */
  onCodeChange?: (code: string | null) => void
}

type InvalidReason =
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'MIN_AMOUNT_NOT_MET'
  | 'EXHAUSTED'
  | 'USER_LIMIT_REACHED'
  | string

interface ValidateResponse {
  valid: boolean
  discountAmount?: number
  reason?: InvalidReason
}

const REASON_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'This coupon code is invalid',
  EXPIRED: 'This coupon has expired',
  MIN_AMOUNT_NOT_MET: 'Minimum order amount not met for this coupon',
  EXHAUSTED: 'This coupon has reached its usage limit',
  USER_LIMIT_REACHED: 'You have already used this coupon the maximum number of times',
}

function reasonToMessage(reason?: InvalidReason): string {
  if (!reason) return 'This coupon code is invalid'
  return REASON_MESSAGES[reason] ?? 'This coupon code is invalid'
}

export default function CouponInput({ orderTotal, onDiscountChange, onCodeChange }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(false)

  const resetResult = () => {
    setError('')
    setApplied(false)
    setDiscountAmount(null)
    onDiscountChange(null)
    onCodeChange?.(null)
  }

  const validateCoupon = async () => {
    const trimmed = couponCode.trim()
    if (!trimmed) {
      resetResult()
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, orderTotal }),
      })

      if (!res.ok) {
        setApplied(false)
        setDiscountAmount(null)
        onDiscountChange(null)
        onCodeChange?.(null)
        setError('Something went wrong while validating the coupon. Please try again.')
        return
      }

      const data: ValidateResponse = await res.json()

      if (data.valid) {
        const amount = data.discountAmount ?? 0
        setDiscountAmount(amount)
        setApplied(true)
        setError('')
        onDiscountChange(amount)
        onCodeChange?.(trimmed.toUpperCase())
      } else {
        setApplied(false)
        setDiscountAmount(null)
        onDiscountChange(null)
        onCodeChange?.(null)
        setError(reasonToMessage(data.reason))
      }
    } catch {
      setApplied(false)
      setDiscountAmount(null)
      onDiscountChange(null)
      onCodeChange?.(null)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setCouponCode('')
    setError('')
    setApplied(false)
    setDiscountAmount(null)
    onDiscountChange(null)
    onCodeChange?.(null)
  }

  return (
    <div className="w-full space-y-2">
      <Label htmlFor="coupon-code">Promo Code (optional)</Label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="coupon-code"
          name="coupon-code"
          type="text"
          placeholder="Enter promo code"
          value={couponCode}
          disabled={loading || applied}
          onChange={(e) => {
            setCouponCode(e.target.value)
            if (error) setError('')
          }}
          onBlur={validateCoupon}
          className="flex-1 uppercase placeholder:normal-case"
        />
        <Button
          type="button"
          variant="outline"
          disabled={loading || applied || !couponCode.trim()}
          onClick={validateCoupon}
          className="sm:w-28"
        >
          {loading ? 'Checking...' : 'Apply'}
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Validating coupon...</p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && applied && discountAmount !== null && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/30">
          <div className="text-sm text-green-600 dark:text-green-400">
            <p className="font-medium">Coupon applied successfully</p>
            <p>Discount: -Rs {discountAmount.toFixed(2)}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Remove code
          </button>
        </div>
      )}
    </div>
  )
}
