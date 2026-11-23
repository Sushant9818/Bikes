import { z } from 'zod'

const couponBaseSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Max 50 chars'),
  description: z.string().max(500, 'Max 500 chars').optional().nullable(),
  discountPercent: z.number().positive('Must be greater than 0').max(100, 'Max 100%').optional(),
  discountFixed: z.number().positive('Must be greater than 0').optional(),
  minAmount: z.number().min(0, 'Must be >= 0').optional().nullable(),
  maxUses: z.number().int().positive('Must be a positive integer').optional().nullable(),
  // Per-user cap, persisted on the `coupons.maxUsesPerUser` column (added by
  // prisma/migrations/add_max_uses_per_user). Null means unlimited uses per
  // user; omitted falls back to the column default (1). Enforcement of the
  // actual limit happens in the validation logic (coupon redemption), not here.
  maxUsesPerUser: z.number().int().positive('Must be a positive integer').optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  isActive: z.boolean(),
})

// Either a percentage discount OR a fixed discount must be set — never both,
// never neither. (lib/validations/coupon.ts mirrors the check already done
// ad-hoc in app/api/coupons/validate/route.ts.)
const withDiscountRefinement = <T extends typeof couponBaseSchema>(schema: T) =>
  schema
    .refine(data => data.discountPercent !== undefined || data.discountFixed !== undefined, {
      message: 'Either discountPercent or discountFixed is required',
      path: ['discountPercent'],
    })
    .refine(data => !(data.discountPercent !== undefined && data.discountFixed !== undefined), {
      message: 'Provide discountPercent or discountFixed, not both',
      path: ['discountFixed'],
    })

export const couponInputSchema = withDiscountRefinement(couponBaseSchema)
export const couponUpdateSchema = withDiscountRefinement(couponBaseSchema)

export type CouponInput = z.infer<typeof couponBaseSchema>
export type CouponUpdate = z.infer<typeof couponBaseSchema>
