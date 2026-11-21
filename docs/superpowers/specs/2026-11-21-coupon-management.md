# Coupon & Discount Management System - Design Spec

**Goal:** Enable admins to create promotional coupons and customers to apply discount codes at checkout.

**Scope:** Admin CRUD for coupons, customer coupon application at checkout, usage tracking and validation.

## Architecture

**Data Flow:**
1. Admin creates coupon with code, discount (% or fixed), min order amount, usage limits, expiry
2. Coupon stored in Prisma Coupon model with metadata
3. Customer enters code at checkout
4. Validation: code exists, not expired, min order met, usage limits not exceeded
5. Discount calculated and applied to order total
6. Order saved with couponCode reference
7. Usage tracked (incremented on order creation)

**Coupon States:**
- ACTIVE: Valid, within usage limits, not expired
- EXPIRED: Past expiryDate
- EXHAUSTED: Reached maxUses limit
- INACTIVE: Manually disabled (future)

## Database Schema

**Existing Coupon model** (Prisma):
```prisma
model Coupon {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  description     String?
  discountPercent Float?    // e.g., 10 for 10%
  discountFixed   Float?    // e.g., 500 for Rs 500
  minAmount       Float?    // Minimum order amount to apply
  maxUses         Int?      // Null = unlimited
  usesCount       Int       @default(0)
  expiryDate      DateTime? @map("expiry_date")
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
}
```

**Add to Order model:**
```prisma
couponCode      String?     @map("coupon_code")  // Reference to Coupon.code
discountAmount  Float?      @map("discount_amount")
```

**Add to Order creation:**
Track per-user redemption: use Order.userId + couponCode to enforce maxUsesPerUser

## Components & Pages

### Admin Side

**CouponsPage** (`app/admin/(dashboard)/coupons/page.tsx`):
- Table of all coupons: code, discount type, amount, min order, uses/max, expiry, status badge, actions
- Status badge: green (active), yellow (expiring soon), red (expired/exhausted)
- Action buttons: Edit, Delete (with confirmation)
- Create button opens modal

**CouponModal** (`components/admin/CouponModal.tsx`):
- Form fields:
  - Code (required, alphanumeric uppercase)
  - Description (optional)
  - Discount Type: Percentage OR Fixed Amount (radio)
  - Discount Value (required if type selected)
  - Minimum Order Amount (optional)
  - Maximum Total Uses (optional, null = unlimited)
  - Maximum Uses Per User (optional, default 1)
  - Expiry Date (optional datetime picker)
  - Active (toggle, default true)
- Validation: either % or fixed (not both), discount > 0, min amount >= 0
- Submit: Create or Update (title changes)
- Cancel closes modal

**CouponsList** (`components/admin/CouponsList.tsx`):
- Paginated table component
- Search by code
- Filter by status (active/expired/exhausted)
- Delete handler with confirmation

### Customer Side

**Checkout Integration:**
- Add coupon input field before payment section
- Text input with label "Promo Code" (optional)
- Real-time validation on blur/input
- Show discount breakdown: "Discount: -Rs 500"
- Show final total after discount
- Error messages: invalid code, expired, min order not met, limit reached, user limit reached
- Success message: "Coupon applied: Rs X discount"

**CouponInput** (`components/checkout/CouponInput.tsx`):
- Input field with apply button (or auto-validate on blur)
- Call POST /api/coupons/validate to check validity
- If valid, show discount amount
- If invalid, show error message
- Allow code removal to clear discount
- State management: couponCode, discountAmount, error

## API Endpoints

**GET `/api/coupons`** - Public list of active coupons:
```json
{
  "coupons": [
    {
      "id": 1,
      "code": "SUMMER20",
      "description": "Summer sale",
      "discountPercent": 20,
      "minAmount": 1000,
      "expiryDate": "2026-12-31"
    }
  ]
}
```

**POST `/api/coupons/validate`** - Validate & get discount:
```json
Request: { "code": "SUMMER20", "orderTotal": 5000, "userId": 123 }

Response: {
  "valid": true,
  "discountAmount": 1000,
  "minAmountMet": true,
  "usageAllowed": true
}

Error: {
  "valid": false,
  "reason": "EXPIRED" | "EXHAUSTED" | "MIN_AMOUNT_NOT_MET" | "USER_LIMIT_REACHED" | "NOT_FOUND"
}
```

**POST `/api/admin/coupons`** - Create coupon (admin only):
```json
Request: {
  "code": "SUMMER20",
  "description": "Summer discount",
  "discountPercent": 20,
  "minAmount": 1000,
  "maxUses": 100,
  "maxUsesPerUser": 1,
  "expiryDate": "2026-12-31",
  "isActive": true
}

Response: { "id": 1, "code": "SUMMER20", ... }
```

**PUT `/api/admin/coupons/[id]`** - Update coupon (admin only):
Same request body as POST

**DELETE `/api/admin/coupons/[id]`** - Delete coupon (admin only):
No body, returns 200 on success

**GET `/api/admin/coupons`** - List all coupons (admin only):
Paginated list with metadata (uses count, status, etc.)

## Validation Rules

1. **Code valid**: Exists in database, isActive = true
2. **Not expired**: expiryDate is null OR expiryDate > now()
3. **Min amount met**: minAmount is null OR orderTotal >= minAmount
4. **Usage limit not hit**: maxUses is null OR usesCount < maxUses
5. **Per-user limit not hit**: maxUsesPerUser enforced by counting user's past orders with this coupon
6. **Code format**: Alphanumeric uppercase, 3-20 chars

## Error Handling

- Invalid coupon code: "Coupon code not found"
- Expired: "This coupon has expired"
- Min order not met: "Minimum order amount Rs X required"
- Usage exhausted: "This coupon is no longer available"
- User limit reached: "You can only use this coupon once"
- Discount calculation error: "Unable to apply coupon, please try again"

## UI/UX Details

**Admin:**
- Status badges with colors: active (green), expiring (yellow), expired (red), exhausted (orange)
- "Expiring soon" = within 7 days
- Pagination: 10 coupons per page
- Delete confirmation: "Delete coupon SUMMER20? This cannot be undone."

**Checkout:**
- Discount shown as line item: "Promo Code (SUMMER20): -Rs 500"
- Error text: red color (text-red-600 dark:text-red-400)
- Success text: green color (text-green-600 dark:text-green-400)
- Remove coupon link: "Remove code"

**Dark Mode:** All admin & checkout components use dark: Tailwind classes

## Implementation Notes

**Per-User Tracking:**
Since Coupon model doesn't have relationship to User, track per-user usage by:
- Query: `Order.where({ userId, couponCode }).count()`
- Compare against Coupon.maxUsesPerUser
- Enforce at API level before creating order

**Discount Calculation:**
```
if discountPercent: discount = orderTotal * (discountPercent / 100)
else if discountFixed: discount = discountFixed
finalTotal = orderTotal - discount (capped at 0, min 0)
```

**Usage Tracking:**
Increment Coupon.usesCount on successful order creation (POST /api/orders)

## Testing

**Unit:**
- Coupon validation logic (expired, min amount, usage limits)
- Discount calculation (% vs fixed)
- Per-user limit enforcement

**Integration:**
- Create coupon → Apply at checkout → Order saved with couponCode
- Apply invalid coupon → Error shown
- Exhausted coupon → Cannot apply

**E2E:**
- Admin creates SUMMER20 (20% off, min 1000, max 100 uses, max 1 per user)
- Customer sees coupon in list
- Customer applies at checkout, sees -20% discount
- Order saved with couponCode and discountAmount
- Next customer can't apply same coupon (1 per user limit)

## Success Criteria

✓ Admins can CRUD coupons with full control
✓ Customers can apply valid coupons at checkout
✓ Discount calculated and applied to order total
✓ Usage tracked per coupon and per user
✓ Validation prevents invalid/expired/exhausted coupon usage
✓ Dark mode support throughout
✓ Build passes TypeScript check
✓ All validations tested
