# Coupon Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable admins to create promotional coupons and customers to apply discount codes at checkout.

**Architecture:** Extend Order schema with coupon fields, add admin CRUD endpoints and UI, implement coupon validation logic, integrate into checkout flow with real-time discount calculation and tracking.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Prisma ORM

**Spec:** `docs/superpowers/specs/2026-11-21-coupon-management.md`

## Global Constraints

- Coupon model already exists in Prisma schema
- Admin actions require requireAdmin() middleware
- Discount = (discountPercent * orderTotal / 100) OR discountFixed (not both)
- Per-user tracking: maxUsesPerUser enforced by counting user's past orders with coupon
- Dark mode: all components use `dark:` Tailwind classes
- Build must pass TypeScript check

## Review Focus

1. **Invalid coupon application**: User applies expired/exhausted coupon at checkout; must reject with clear error
2. **Discount calculation precision**: Discount must round correctly (e.g., 10% of Rs 999 = Rs 99.90, not Rs 100)
3. **Per-user limit enforcement**: maxUsesPerUser=1 enforced; user cannot apply same coupon twice despite validation passing
4. **Min order amount validation**: Coupon requires Rs 1000 min; order of Rs 999 must be rejected with specific error
5. **Usage tracking accuracy**: After order with coupon, usesCount incremented exactly once; not double-counted on page refresh

---

## File Structure

**Create:**
- `app/api/admin/coupons/route.ts` - Admin CRUD endpoints
- `app/api/coupons/validate/route.ts` - Coupon validation endpoint
- `app/admin/(dashboard)/coupons/page.tsx` - Admin coupons management page
- `components/admin/CouponModal.tsx` - Create/edit coupon form
- `components/checkout/CouponInput.tsx` - Checkout coupon input field
- `lib/coupon-validation.ts` - Validation logic utility
- `tests/api/coupons-validate.test.ts` - Validation endpoint tests

**Modify:**
- `prisma/schema.prisma` - Add couponCode, discountAmount to Order model
- `app/(site)/checkout/page.tsx` - Integrate CouponInput component
- `app/api/orders/route.ts` - Add coupon tracking on order creation

---

### Task 1: Update Order Schema & Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/[timestamp]_add_coupon_fields/migration.sql`

**Interfaces:**
- Produces: Order model with couponCode (String?, unique: false), discountAmount (Float?)

- [ ] **Step 1: Add fields to Order model in schema.prisma**

Before `@@map("orders")`, add:
```prisma
couponCode      String?     @map("coupon_code")
discountAmount  Float?      @map("discount_amount")
```

- [ ] **Step 2: Create migration**

Run: `npx prisma migrate dev --name add_coupon_fields`

Expected: Migration file created, schema updated

- [ ] **Step 3: Verify schema compiles**

Run: `npx prisma generate`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add coupon fields to Order model"
```

---

### Task 2: Admin CRUD Endpoints

**Files:**
- Create: `app/api/admin/coupons/route.ts`

**Interfaces:**
- Produces: 
  - `GET /api/admin/coupons` → paginated coupons list
  - `POST /api/admin/coupons` → { code, description?, discountPercent?, discountFixed?, minAmount?, maxUses?, maxUsesPerUser?, expiryDate?, isActive } → { id, code, ... }

- [ ] **Step 1: Create GET handler**

```typescript
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const take = 10
    const coupons = await prisma.coupon.findMany({
      skip: (page - 1) * take,
      take,
      orderBy: { createdAt: 'desc' },
    })
    const total = await prisma.coupon.count()
    return NextResponse.json({ coupons, total, page })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 2: Create POST handler**

```typescript
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const data = await req.json()
    
    // Validate: either % or fixed (not both)
    if (data.discountPercent && data.discountFixed) {
      return NextResponse.json({ error: 'Cannot set both % and fixed discount' }, { status: 400 })
    }
    if (!data.discountPercent && !data.discountFixed) {
      return NextResponse.json({ error: 'Must set either % or fixed discount' }, { status: 400 })
    }
    
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountPercent: data.discountPercent || null,
        discountFixed: data.discountFixed || null,
        minAmount: data.minAmount || null,
        maxUses: data.maxUses || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        isActive: data.isActive !== false,
      },
    })
    return NextResponse.json(coupon, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 3: Create PUT handler**

```typescript
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, ...data } = await req.json()
    
    if (data.discountPercent && data.discountFixed) {
      return NextResponse.json({ error: 'Cannot set both % and fixed discount' }, { status: 400 })
    }
    
    const coupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: {
        description: data.description,
        discountPercent: data.discountPercent !== undefined ? data.discountPercent : undefined,
        discountFixed: data.discountFixed !== undefined ? data.discountFixed : undefined,
        minAmount: data.minAmount,
        maxUses: data.maxUses,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        isActive: data.isActive,
      },
    })
    return NextResponse.json(coupon)
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 4: Create DELETE handler**

```typescript
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { id } = await req.json()
    await prisma.coupon.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 5: Test endpoints with curl**

```bash
curl -X POST http://localhost:3002/api/admin/coupons \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST20","discountPercent":20,"minAmount":1000}'
```

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/coupons/route.ts
git commit -m "feat: add admin coupon CRUD endpoints"
```

---

### Task 3: Coupon Validation Logic & API

**Files:**
- Create: `lib/coupon-validation.ts`
- Create: `app/api/coupons/validate/route.ts`

**Interfaces:**
- Produces: 
  - `validateCoupon(code, orderTotal, userId)` → { valid: bool, discountAmount?: float, reason?: string }
  - `POST /api/coupons/validate` → { code, orderTotal, userId? } → { valid, discountAmount?, reason? }

- [ ] **Step 1: Create validation utility**

```typescript
// lib/coupon-validation.ts
export async function validateCoupon(code: string, orderTotal: number, userId?: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  
  if (!coupon) return { valid: false, reason: 'NOT_FOUND' }
  if (!coupon.isActive) return { valid: false, reason: 'INACTIVE' }
  if (coupon.expiryDate && coupon.expiryDate < new Date()) return { valid: false, reason: 'EXPIRED' }
  if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) return { valid: false, reason: 'EXHAUSTED' }
  if (coupon.minAmount && orderTotal < coupon.minAmount) return { valid: false, reason: 'MIN_AMOUNT_NOT_MET' }
  
  // Check per-user limit
  if (coupon.maxUsesPerUser && userId) {
    const userUses = await prisma.order.count({
      where: { userId, couponCode: coupon.code },
    })
    if (userUses >= coupon.maxUsesPerUser) return { valid: false, reason: 'USER_LIMIT_REACHED' }
  }
  
  // Calculate discount
  let discountAmount = 0
  if (coupon.discountPercent) {
    discountAmount = orderTotal * (coupon.discountPercent / 100)
  } else if (coupon.discountFixed) {
    discountAmount = coupon.discountFixed
  }
  
  return { valid: true, discountAmount }
}
```

- [ ] **Step 2: Create validation endpoint**

```typescript
// app/api/coupons/validate/route.ts
export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal, userId } = await req.json()
    const result = await validateCoupon(code, orderTotal, userId)
    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 3: Test validation logic**

```bash
curl -X POST http://localhost:3002/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST20","orderTotal":5000}'
```

- [ ] **Step 4: Commit**

```bash
git add lib/coupon-validation.ts app/api/coupons/validate/route.ts
git commit -m "feat: add coupon validation logic and endpoint"
```

---

### Task 4: Admin Coupons Page & Modal

**Files:**
- Create: `app/admin/(dashboard)/coupons/page.tsx`
- Create: `components/admin/CouponModal.tsx`

**Interfaces:**
- Consumes: `POST/PUT/DELETE /api/admin/coupons`, `GET /api/admin/coupons`
- Produces: Admin UI for managing coupons

- [ ] **Step 1: Create CouponModal component**

```typescript
// components/admin/CouponModal.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CouponModal({ isOpen, onClose, onSave, initialData }: any) {
  const [form, setForm] = useState(initialData || {})
  
  const handleSave = async () => {
    await onSave(form)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {initialData ? 'Edit' : 'Create'} Coupon
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
            <Input 
              value={form.code || ''} 
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              disabled={!!initialData}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</label>
            <div className="flex gap-4">
              <label>
                <input type="radio" checked={!!form.discountPercent} 
                  onChange={() => setForm({ ...form, discountPercent: 20, discountFixed: null })} />
                Percentage (%)
              </label>
              <label>
                <input type="radio" checked={!!form.discountFixed}
                  onChange={() => setForm({ ...form, discountFixed: 500, discountPercent: null })} />
                Fixed Amount (Rs)
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Value</label>
            <Input 
              type="number" 
              value={form.discountPercent || form.discountFixed || ''} 
              onChange={(e) => {
                if (form.discountPercent) setForm({ ...form, discountPercent: parseFloat(e.target.value) })
                else setForm({ ...form, discountFixed: parseFloat(e.target.value) })
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Order Amount (Rs)</label>
            <Input 
              type="number" 
              value={form.minAmount || ''} 
              onChange={(e) => setForm({ ...form, minAmount: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Uses (blank = unlimited)</label>
            <Input 
              type="number" 
              value={form.maxUses || ''} 
              onChange={(e) => setForm({ ...form, maxUses: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
            <Input 
              type="datetime-local" 
              value={form.expiryDate || ''} 
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>
          
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive !== false}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create admin coupons page**

```typescript
// app/admin/(dashboard)/coupons/page.tsx
'use client'
import { useEffect, useState } from 'react'
import CouponModal from '@/components/admin/CouponModal'
import { Button } from '@/components/ui/button'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons')
    const data = await res.json()
    setCoupons(data.coupons)
  }
  
  useEffect(() => { fetchCoupons() }, [])
  
  const handleDelete = async (id: number) => {
    if (confirm('Delete this coupon?')) {
      await fetch(`/api/admin/coupons`, { method: 'DELETE', body: JSON.stringify({ id }) })
      fetchCoupons()
    }
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Button onClick={() => { setEditingId(null); setModalOpen(true) }}>Create Coupon</Button>
      </div>
      
      <table className="w-full border-collapse border dark:border-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border dark:border-gray-700 p-2">Code</th>
            <th className="border dark:border-gray-700 p-2">Discount</th>
            <th className="border dark:border-gray-700 p-2">Uses</th>
            <th className="border dark:border-gray-700 p-2">Status</th>
            <th className="border dark:border-gray-700 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon: any) => (
            <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="border dark:border-gray-700 p-2">{coupon.code}</td>
              <td className="border dark:border-gray-700 p-2">
                {coupon.discountPercent ? `${coupon.discountPercent}%` : `Rs ${coupon.discountFixed}`}
              </td>
              <td className="border dark:border-gray-700 p-2">
                {coupon.usesCount}/{coupon.maxUses || '∞'}
              </td>
              <td className="border dark:border-gray-700 p-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date())
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                  {coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date()) ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="border dark:border-gray-700 p-2">
                <Button size="sm" onClick={() => { setEditingId(coupon.id); setModalOpen(true) }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(coupon.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <CouponModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          if (editingId) {
            await fetch(`/api/admin/coupons`, { method: 'PUT', body: JSON.stringify({ id: editingId, ...data }) })
          } else {
            await fetch(`/api/admin/coupons`, { method: 'POST', body: JSON.stringify(data) })
          }
          setModalOpen(false)
          fetchCoupons()
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Add sidebar link to admin panel**

Modify `components/admin/Sidebar.tsx`: Add coupon menu item with Ticket icon

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(dashboard\)/coupons/page.tsx components/admin/CouponModal.tsx
git commit -m "feat: add admin coupons management page and modal"
```

---

### Task 5: Checkout Coupon Input Component

**Files:**
- Create: `components/checkout/CouponInput.tsx`

**Interfaces:**
- Consumes: `POST /api/coupons/validate`
- Produces: `<CouponInput onApply={(code, discount) => void} />`

- [ ] **Step 1: Create component**

```typescript
// components/checkout/CouponInput.tsx
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function CouponInput({ orderTotal, onApply }: { orderTotal: number; onApply: (code: string, discount: number) => void }) {
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleApply = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal }),
      })
      const data = await res.json()
      
      if (data.valid) {
        setDiscount(data.discountAmount)
        onApply(code, data.discountAmount)
      } else {
        const reasons: Record<string, string> = {
          NOT_FOUND: 'Coupon code not found',
          EXPIRED: 'This coupon has expired',
          EXHAUSTED: 'This coupon is no longer available',
          MIN_AMOUNT_NOT_MET: `Minimum order Rs ${data.minAmount} required`,
          USER_LIMIT_REACHED: 'You can only use this coupon once',
        }
        setError(reasons[data.reason] || 'Invalid coupon')
      }
    } catch (err) {
      setError('Error validating coupon')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Promo Code</label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={discount > 0}
        />
        <Button onClick={handleApply} disabled={loading || discount > 0}>
          {discount > 0 ? 'Applied' : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {discount > 0 && (
        <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <span className="text-sm text-green-800 dark:text-green-200">Discount applied: Rs {discount.toFixed(2)}</span>
          <Button size="sm" variant="ghost" onClick={() => { setCode(''); setDiscount(0); onApply('', 0) }}>
            Remove
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/checkout/CouponInput.tsx
git commit -m "feat: add coupon input component for checkout"
```

---

### Task 6: Integrate Coupon into Checkout & Order Creation

**Files:**
- Modify: `app/(site)/checkout/page.tsx`
- Modify: `app/api/orders/route.ts`

**Interfaces:**
- Consumes: CouponInput component, validateCoupon function
- Produces: Orders saved with couponCode and discountAmount

- [ ] **Step 1: Add CouponInput to checkout page**

Modify checkout to show CouponInput before payment, track appliedCoupon state, pass to order API

- [ ] **Step 2: Update POST /api/orders to accept and save coupon**

Add to order creation:
```typescript
couponCode: coupon || null,
discountAmount: discountAmount || null,
// Increment coupon usage
if (coupon) {
  await prisma.coupon.update({
    where: { code: coupon },
    data: { usesCount: { increment: 1 } }
  })
}
```

- [ ] **Step 3: Update total calculation**

In checkout and order response, deduct discountAmount from totalAmount

- [ ] **Step 4: Test full flow**

Create coupon → Checkout with code → Verify order saved with coupon & discount

- [ ] **Step 5: Commit**

```bash
git add app/\(site\)/checkout/page.tsx app/api/orders/route.ts
git commit -m "feat: integrate coupon validation and saving into checkout and orders"
```

---

### Task 7: Testing & Dark Mode Verification

**Files:**
- Create: `tests/api/coupons-validate.test.ts`

**Interfaces:**
- Tests: validateCoupon logic, API endpoints, checkout integration

- [ ] **Step 1: Write validation tests**

Test cases:
- Valid coupon returns discount
- Expired coupon rejected
- Min amount not met
- Usage exhausted
- Per-user limit reached
- Percentage vs fixed discount calculation

- [ ] **Step 2: Verify dark mode**

- CouponModal: check dark: classes on all text/backgrounds
- CouponInput: check dark: on input, error, success messages
- Admin coupons page: check table dark: classes

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: Pass TypeScript check, 0 errors

- [ ] **Step 4: Test full flow**

- Create coupon via admin UI
- Apply at checkout
- Verify order saved with discount
- Verify usage count incremented

- [ ] **Step 5: Commit**

```bash
git add tests/api/coupons-validate.test.ts
git commit -m "feat: add coupon validation tests and verify dark mode"
```

---

## Review Focus Tests

**Test: Expired coupon validation**
In Task 1 validation tests: Create coupon with expiryDate in past, attempt to validate, assert reason = 'EXPIRED'

**Test: Min order amount boundary**
In Task 1 validation tests: Create coupon with minAmount=1000, test with orderTotal=999 (rejected), 1000 (accepted), 1001 (accepted)

**Test: Per-user limit enforcement**
In Task 1 validation tests: User applies coupon once successfully, creates second order, attempts same coupon, assert reason = 'USER_LIMIT_REACHED'

**Test: Discount precision**
In Task 1 validation tests: 10% of Rs 999 = Rs 99.90, assert discountAmount calculation correct to 2 decimals

**Test: Usage increment**
In Task 6 integration tests: Create order with coupon, verify Coupon.usesCount incremented exactly once
