'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export interface CouponData {
  id: number
  code: string
  description?: string | null
  discountPercent: number
  discountFixed?: number | null
  minAmount?: number | null
  maxUses?: number | null
  maxUsesPerUser?: number | null
  usesCount?: number
  expiryDate?: string | Date | null
  isActive: boolean
}

interface CouponModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  coupon?: CouponData | null
  onSuccess: () => void
}

type DiscountType = 'PERCENT' | 'FIXED'

interface FormState {
  code: string
  description: string
  discountType: DiscountType
  discountPercent: string
  discountFixed: string
  minAmount: string
  maxUses: string
  maxUsesPerUser: string
  expiryDate: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountPercent: '',
  discountFixed: '',
  minAmount: '',
  maxUses: '',
  maxUsesPerUser: '',
  expiryDate: '',
  isActive: true,
}

function toDateInputValue(value?: string | Date | null): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function couponToFormState(coupon: CouponData): FormState {
  const hasFixed = coupon.discountFixed !== null && coupon.discountFixed !== undefined && coupon.discountFixed > 0
  return {
    code: coupon.code || '',
    description: coupon.description || '',
    discountType: hasFixed ? 'FIXED' : 'PERCENT',
    discountPercent: coupon.discountPercent ? String(coupon.discountPercent) : '',
    discountFixed: coupon.discountFixed ? String(coupon.discountFixed) : '',
    minAmount: coupon.minAmount !== null && coupon.minAmount !== undefined ? String(coupon.minAmount) : '',
    maxUses: coupon.maxUses !== null && coupon.maxUses !== undefined ? String(coupon.maxUses) : '',
    maxUsesPerUser:
      coupon.maxUsesPerUser !== null && coupon.maxUsesPerUser !== undefined ? String(coupon.maxUsesPerUser) : '',
    expiryDate: toDateInputValue(coupon.expiryDate),
    isActive: coupon.isActive,
  }
}

const CODE_PATTERN = /^[A-Z0-9]+$/

export default function CouponModal({ open, onOpenChange, mode, coupon, onSuccess }: CouponModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!open) return
    setErrors({})
    setApiError('')
    setSuccessMessage('')
    if (mode === 'edit' && coupon) {
      setForm(couponToFormState(coupon))
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, mode, coupon])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (data: FormState): Partial<Record<keyof FormState, string>> => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    const code = data.code.trim().toUpperCase()
    if (!code) {
      nextErrors.code = 'Code is required'
    } else if (!CODE_PATTERN.test(code)) {
      nextErrors.code = 'Code must be alphanumeric uppercase (letters and numbers only)'
    }

    const percentFilled = data.discountPercent.trim() !== ''
    const fixedFilled = data.discountFixed.trim() !== ''

    if (percentFilled && fixedFilled) {
      nextErrors.discountFixed = 'Provide either a percentage or a fixed discount, not both'
    } else if (!percentFilled && !fixedFilled) {
      nextErrors.discountPercent = 'Either a percentage or a fixed discount is required'
    } else if (percentFilled) {
      const percentValue = Number(data.discountPercent)
      if (Number.isNaN(percentValue) || percentValue <= 0) {
        nextErrors.discountPercent = 'Must be greater than 0'
      } else if (percentValue > 100) {
        nextErrors.discountPercent = 'Must be 100 or less'
      }
    } else if (fixedFilled) {
      const fixedValue = Number(data.discountFixed)
      if (Number.isNaN(fixedValue) || fixedValue <= 0) {
        nextErrors.discountFixed = 'Must be greater than 0'
      }
    }

    if (data.minAmount.trim() !== '') {
      const minAmountValue = Number(data.minAmount)
      if (Number.isNaN(minAmountValue) || minAmountValue < 0) {
        nextErrors.minAmount = 'Must be 0 or greater'
      }
    }

    if (data.maxUses.trim() !== '') {
      const maxUsesValue = Number(data.maxUses)
      if (Number.isNaN(maxUsesValue) || maxUsesValue <= 0 || !Number.isInteger(maxUsesValue)) {
        nextErrors.maxUses = 'Must be a positive whole number'
      }
    }

    if (data.maxUsesPerUser.trim() !== '') {
      const maxUsesPerUserValue = Number(data.maxUsesPerUser)
      if (Number.isNaN(maxUsesPerUserValue) || maxUsesPerUserValue <= 0 || !Number.isInteger(maxUsesPerUserValue)) {
        nextErrors.maxUsesPerUser = 'Must be a positive whole number'
      }
    }

    return nextErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    setSuccessMessage('')

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discountPercent: form.discountPercent.trim() !== '' ? Number(form.discountPercent) : undefined,
        discountFixed: form.discountFixed.trim() !== '' ? Number(form.discountFixed) : undefined,
        minAmount: form.minAmount.trim() !== '' ? Number(form.minAmount) : null,
        maxUses: form.maxUses.trim() !== '' ? Number(form.maxUses) : null,
        maxUsesPerUser: form.maxUsesPerUser.trim() !== '' ? Number(form.maxUsesPerUser) : null,
        expiryDate: form.expiryDate ? `${form.expiryDate}T00:00:00Z` : null,
        isActive: form.isActive,
      }

      const url = mode === 'edit' && coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = `Failed to ${mode === 'edit' ? 'update' : 'create'} coupon`
        try {
          const data = await res.json()
          message = data.message || data.error || message
        } catch {
          // ignore JSON parse failure, use default message
        }
        throw new Error(message)
      }

      setSuccessMessage(mode === 'edit' ? 'Coupon updated successfully' : 'Coupon created successfully')
      onSuccess()
      setTimeout(() => {
        onOpenChange(false)
      }, 900)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
        </DialogHeader>

        {apiError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="coupon-code" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
              Code *
            </Label>
            <Input
              id="coupon-code"
              placeholder="SAVE20"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value.toUpperCase())}
              disabled={submitting}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          <div>
            <Label htmlFor="coupon-description" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
              Description
            </Label>
            <Textarea
              id="coupon-description"
              placeholder="Describe the coupon..."
              rows={2}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <Label className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">Discount Type *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="discountType"
                  value="PERCENT"
                  checked={form.discountType === 'PERCENT'}
                  onChange={() => updateField('discountType', 'PERCENT')}
                  disabled={submitting}
                />
                Percentage
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="discountType"
                  value="FIXED"
                  checked={form.discountType === 'FIXED'}
                  onChange={() => updateField('discountType', 'FIXED')}
                  disabled={submitting}
                />
                Fixed Amount
              </label>
            </div>
          </div>

          {form.discountType === 'PERCENT' ? (
            <div>
              <Label htmlFor="coupon-percent" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
                Discount Percentage *
              </Label>
              <Input
                id="coupon-percent"
                type="number"
                min="0"
                max="100"
                placeholder="10"
                value={form.discountPercent}
                onChange={(e) => updateField('discountPercent', e.target.value)}
                disabled={submitting}
              />
              {errors.discountPercent && <p className="text-red-500 text-sm mt-1">{errors.discountPercent}</p>}
            </div>
          ) : (
            <div>
              <Label htmlFor="coupon-fixed" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
                Fixed Discount Amount (₹) *
              </Label>
              <Input
                id="coupon-fixed"
                type="number"
                min="0"
                placeholder="500"
                value={form.discountFixed}
                onChange={(e) => updateField('discountFixed', e.target.value)}
                disabled={submitting}
              />
              {errors.discountFixed && <p className="text-red-500 text-sm mt-1">{errors.discountFixed}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coupon-min-amount" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
                Min Order Amount (₹)
              </Label>
              <Input
                id="coupon-min-amount"
                type="number"
                min="0"
                placeholder="0"
                value={form.minAmount}
                onChange={(e) => updateField('minAmount', e.target.value)}
                disabled={submitting}
              />
              {errors.minAmount && <p className="text-red-500 text-sm mt-1">{errors.minAmount}</p>}
            </div>

            <div>
              <Label htmlFor="coupon-expiry" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
                Expiry Date
              </Label>
              <Input
                id="coupon-expiry"
                type="date"
                value={form.expiryDate}
                onChange={(e) => updateField('expiryDate', e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="coupon-max-uses" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
                Max Uses (total)
              </Label>
              <Input
                id="coupon-max-uses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.maxUses}
                onChange={(e) => updateField('maxUses', e.target.value)}
                disabled={submitting}
              />
              {errors.maxUses && <p className="text-red-500 text-sm mt-1">{errors.maxUses}</p>}
            </div>

            <div>
              <Label htmlFor="coupon-max-uses-per-user" className="text-zinc-900 dark:text-zinc-100 mb-1.5 block">
                Max Uses Per User
              </Label>
              <Input
                id="coupon-max-uses-per-user"
                type="number"
                min="1"
                placeholder="1"
                value={form.maxUsesPerUser}
                onChange={(e) => updateField('maxUsesPerUser', e.target.value)}
                disabled={submitting}
              />
              {errors.maxUsesPerUser && <p className="text-red-500 text-sm mt-1">{errors.maxUsesPerUser}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              disabled={submitting}
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
