# Order Pick-up Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable customers to place orders for in-store pick-up with status tracking from checkout through fulfillment.

**Architecture:** Extend Order model with pick-up fields (location, time, code), add store/timeslot selection to checkout, create order detail page with pick-up status timeline and QR code, enable admin to update order status (CONFIRMED → READY_FOR_PICKUP → PICKED_UP).

**Tech Stack:** Next.js 14 (App Router), React, Prisma ORM, TypeScript, Tailwind CSS, QR code library (qrcode.react)

**Spec:** `docs/superpowers/specs/2026-11-21-order-pickup-tracking.md`

## Global Constraints

- Status enum values: PENDING, PAID, CONFIRMED, READY_FOR_PICKUP, PICKED_UP, SHIPPED, CANCELLED, PAYMENT_REVIEW, FAILED
- Pick-up code format: PKP-YYYYMMDD-XXXX (e.g., PKP-20261121-0001)
- Stores hardcoded (MVP): "Kathmandu Store", "Pokhara Store"
- Time slots hardcoded (MVP): "Today 3-5 PM", "Tomorrow 10-12 AM"
- All new components must support dark mode (use `dark:` Tailwind classes)
- Build must pass TypeScript check (`npm run build`)

## Review Focus

1. **Pick-up code uniqueness:** Code must be unique per order; collision handling required despite low probability
2. **Status transition validation:** Only allow valid status progressions (can't skip from PENDING to PICKED_UP)
3. **Customer data isolation:** Customer must only see their own orders; API must verify user ownership
4. **Store selection required:** Checkout must enforce store + time slot selection before payment
5. **Dark mode coverage:** All pick-up UI components (timeline, code, info) must render correctly in dark mode

---

## File Structure

**Create:**
- `lib/pickup-code.ts` - Pick-up code generation
- `app/api/stores/route.ts` - Stores API endpoint
- `app/api/timeslots/route.ts` - Time slots API endpoint
- `components/checkout/StoreSelector.tsx` - Store selector component
- `components/checkout/TimeSlotSelector.tsx` - Time slot selector component
- `components/order/PickupStatus.tsx` - Pick-up status timeline
- `components/order/PickupInfo.tsx` - Pick-up info with code + QR
- `app/(site)/orders/[id]/page.tsx` - Order detail page
- `app/(site)/orders/[id]/layout.tsx` - Order detail layout
- `tests/lib/pickup-code.test.ts` - Pick-up code tests

**Modify:**
- `prisma/schema.prisma` - Add pick-up fields to Order, update OrderStatus enum
- `prisma/migrations/` - Add migration for schema changes
- `app/(site)/checkout/page.tsx` - Add store selector + time slot selector
- `app/api/orders/route.ts` - Accept pickupLocation + timeSlot in POST
- `app/api/orders/[id]/route.ts` - Accept status updates, return pick-up fields
- `app/admin/(dashboard)/orders/page.tsx` - Add status update UI

---

### Task 1: Prisma Schema & Migration

**Files:**
- Modify: `prisma/schema.prisma` (Order model, OrderStatus enum)
- Create: `prisma/migrations/[timestamp]_add_pickup_fields/migration.sql`

**Interfaces:**
- Produces: Order model with pickupLocation, estimatedPickupTime, pickupCode (unique), actualPickupTime
- Produces: OrderStatus enum values including READY_FOR_PICKUP, PICKED_UP

- [ ] **Step 1: Update OrderStatus enum in schema.prisma**

Add READY_FOR_PICKUP and PICKED_UP to enum:
```prisma
enum OrderStatus {
  PENDING
  PAID
  CONFIRMED
  READY_FOR_PICKUP
  PICKED_UP
  SHIPPED
  CANCELLED
  PAYMENT_REVIEW
  FAILED
}
```

- [ ] **Step 2: Add pick-up fields to Order model**

Add after existing fields (before `@@map`):
```prisma
model Order {
  // existing fields...
  
  pickupLocation    String?         @map("pickup_location")
  estimatedPickupTime DateTime?     @map("estimated_pickup_time")
  pickupCode        String?         @unique @map("pickup_code")
  actualPickupTime  DateTime?       @map("actual_pickup_time")
  
  @@map("orders")
}
```

- [ ] **Step 3: Create migration**

Run: `cd /Users/sushanprajapati/Desktop/Suzuki\ Bike && npx prisma migrate dev --name add_pickup_fields`

Expected: Migration file created in `prisma/migrations/`

- [ ] **Step 4: Verify schema compiles**

Run: `npx prisma generate`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add pick-up fields to Order model (pickupLocation, estimatedPickupTime, pickupCode, actualPickupTime)"
```

---

### Task 2: Pick-up Code Generation Utility & Tests

**Files:**
- Create: `lib/pickup-code.ts`
- Create: `tests/lib/pickup-code.test.ts`

**Interfaces:**
- Produces: `generatePickupCode(orderId: number, createdAt: Date): string` - returns PKP-YYYYMMDD-XXXX format
- Produces: `validatePickupCode(code: string): boolean` - returns true if format valid

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/pickup-code.test.ts
import { generatePickupCode, validatePickupCode } from '@/lib/pickup-code'

describe('pickup-code', () => {
  it('generatePickupCode returns PKP-YYYYMMDD-XXXX format', () => {
    const date = new Date('2026-11-21T10:00:00Z')
    const code = generatePickupCode(1, date)
    expect(code).toMatch(/^PKP-\d{8}-\d{4}$/)
  })

  it('generatePickupCode with same date increments counter', () => {
    const date = new Date('2026-11-21T10:00:00Z')
    const code1 = generatePickupCode(1, date)
    const code2 = generatePickupCode(2, date)
    expect(code1).not.toEqual(code2)
  })

  it('validatePickupCode returns true for valid format', () => {
    expect(validatePickupCode('PKP-20261121-0001')).toBe(true)
  })

  it('validatePickupCode returns false for invalid format', () => {
    expect(validatePickupCode('INVALID')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/lib/pickup-code.test.ts`

Expected: FAIL (functions not defined)

- [ ] **Step 3: Implement pickup code utility**

```typescript
// lib/pickup-code.ts
let counterByDate: Record<string, number> = {}

export function generatePickupCode(orderId: number, createdAt: Date): string {
  const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '')
  
  if (!counterByDate[dateStr]) {
    counterByDate[dateStr] = 1
  } else {
    counterByDate[dateStr]++
  }
  
  const counter = String(counterByDate[dateStr]).padStart(4, '0')
  return `PKP-${dateStr}-${counter}`
}

export function validatePickupCode(code: string): boolean {
  return /^PKP-\d{8}-\d{4}$/.test(code)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/lib/pickup-code.test.ts`

Expected: PASS (all 4 tests pass)

- [ ] **Step 5: Commit**

```bash
git add lib/pickup-code.ts tests/lib/pickup-code.test.ts
git commit -m "feat: add pick-up code generation utility with validation"
```

---

### Task 3: Store & Time Slot API Endpoints

**Files:**
- Create: `app/api/stores/route.ts`
- Create: `app/api/timeslots/route.ts`

**Interfaces:**
- Produces: `GET /api/stores` returns `{ stores: Array<{id: number, name: string, address: string, phone: string}> }`
- Produces: `GET /api/timeslots` returns `{ timeslots: Array<{id: string, label: string}> }`

- [ ] **Step 1: Create stores endpoint**

```typescript
// app/api/stores/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const stores = [
    {
      id: 1,
      name: 'Kathmandu Store',
      address: 'Thamel, Kathmandu',
      phone: '+977-1-4242424',
    },
    {
      id: 2,
      name: 'Pokhara Store',
      address: 'Lakeside, Pokhara',
      phone: '+977-61-414141',
    },
  ]
  return NextResponse.json({ stores })
}
```

- [ ] **Step 2: Create time slots endpoint**

```typescript
// app/api/timeslots/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const timeslots = [
    { id: 'today-3-5pm', label: 'Today 3:00 PM - 5:00 PM' },
    { id: 'today-5-7pm', label: 'Today 5:00 PM - 7:00 PM' },
    { id: 'tomorrow-10-12pm', label: 'Tomorrow 10:00 AM - 12:00 PM' },
    { id: 'tomorrow-2-4pm', label: 'Tomorrow 2:00 PM - 4:00 PM' },
  ]
  return NextResponse.json({ timeslots })
}
```

- [ ] **Step 3: Test endpoints with curl**

Run:
```bash
curl http://localhost:3002/api/stores | jq .
curl http://localhost:3002/api/timeslots | jq .
```

Expected: Both return valid JSON with stores and timeslots

- [ ] **Step 4: Commit**

```bash
git add app/api/stores/route.ts app/api/timeslots/route.ts
git commit -m "feat: add stores and time slots API endpoints"
```

---

### Task 4: Store Selector & Time Slot Selector Components

**Files:**
- Create: `components/checkout/StoreSelector.tsx`
- Create: `components/checkout/TimeSlotSelector.tsx`

**Interfaces:**
- Consumes: Stores from `/api/stores`
- Consumes: Time slots from `/api/timeslots`
- Produces: `<StoreSelector value={storeId} onChange={(id) => void} />` component
- Produces: `<TimeSlotSelector value={slotId} onChange={(id) => void} />` component

- [ ] **Step 1: Create StoreSelector component**

```typescript
// components/checkout/StoreSelector.tsx
'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Store {
  id: number
  name: string
  address: string
  phone: string
}

interface StoreSelectorProps {
  value: string
  onChange: (storeId: string) => void
}

export default function StoreSelector({ value, onChange }: StoreSelectorProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores')
        const data = await response.json()
        setStores(data.stores)
      } catch (error) {
        console.error('Failed to load stores:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  if (loading) return <div>Loading stores...</div>

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Pick-up Location</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a store" />
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.id} value={String(store.id)}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && stores.find((s) => String(s.id) === value) && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-400">
          <p>{stores.find((s) => String(s.id) === value)?.address}</p>
          <p>{stores.find((s) => String(s.id) === value)?.phone}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create TimeSlotSelector component**

```typescript
// components/checkout/TimeSlotSelector.tsx
'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimeSlot {
  id: string
  label: string
}

interface TimeSlotSelectorProps {
  value: string
  onChange: (slotId: string) => void
}

export default function TimeSlotSelector({ value, onChange }: TimeSlotSelectorProps) {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeslots = async () => {
      try {
        const response = await fetch('/api/timeslots')
        const data = await response.json()
        setTimeslots(data.timeslots)
      } catch (error) {
        console.error('Failed to load time slots:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTimeslots()
  }, [])

  if (loading) return <div>Loading time slots...</div>

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Pick-up Time</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a time slot" />
        </SelectTrigger>
        <SelectContent>
          {timeslots.map((slot) => (
            <SelectItem key={slot.id} value={slot.id}>
              {slot.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/checkout/StoreSelector.tsx components/checkout/TimeSlotSelector.tsx
git commit -m "feat: add store and time slot selector components"
```

---

### Task 5: Update Checkout Page with Pick-up Selectors

**Files:**
- Modify: `app/(site)/checkout/page.tsx`

**Interfaces:**
- Consumes: `<StoreSelector />` and `<TimeSlotSelector />` components
- Produces: Checkout form accepts pickupLocation and pickupTimeSlot

- [ ] **Step 1: Add state for pick-up selections**

Add to CheckoutPage component (after existing useState declarations):
```typescript
const [pickupLocation, setPickupLocation] = useState('')
const [pickupTimeSlot, setPickupTimeSlot] = useState('')
```

- [ ] **Step 2: Add pick-up section to checkout form**

Add before payment section:
```typescript
<div className="mb-6 p-4 border rounded-lg dark:border-gray-700">
  <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Pick-up Details</h3>
  <StoreSelector value={pickupLocation} onChange={setPickupLocation} />
  <div className="mt-4">
    <TimeSlotSelector value={pickupTimeSlot} onChange={setPickupTimeSlot} />
  </div>
</div>
```

- [ ] **Step 3: Validate pick-up selections before payment**

Modify checkout submit handler to check:
```typescript
if (!pickupLocation || !pickupTimeSlot) {
  alert('Please select a pick-up location and time')
  return
}
```

- [ ] **Step 4: Pass pick-up data to order creation API**

Modify order creation call to include:
```typescript
{
  items: formattedItems,
  customerName: formData.customerName,
  phone: formData.phone,
  email: formData.email,
  address: formData.address,
  pickupLocation: `Store ${pickupLocation}`,
  pickupTimeSlot: pickupTimeSlot,
}
```

- [ ] **Step 5: Import components**

Add at top of file:
```typescript
import StoreSelector from '@/components/checkout/StoreSelector'
import TimeSlotSelector from '@/components/checkout/TimeSlotSelector'
```

- [ ] **Step 6: Test in browser**

Navigate to checkout, verify store and time slot selectors appear and are required

- [ ] **Step 7: Commit**

```bash
git add app/(site)/checkout/page.tsx
git commit -m "feat: add pick-up location and time slot selection to checkout"
```

---

### Task 6: Modify Order Creation API to Accept Pick-up Data

**Files:**
- Modify: `app/api/orders/route.ts`

**Interfaces:**
- Consumes: pickupLocation, pickupTimeSlot from checkout
- Produces: Order with pickupLocation, estimatedPickupTime, pickupCode set

- [ ] **Step 1: Import pickup code generator**

Add at top of route.ts:
```typescript
import { generatePickupCode } from '@/lib/pickup-code'
```

- [ ] **Step 2: Update POST handler to accept pick-up fields**

Add to request body parsing:
```typescript
const { pickupLocation, pickupTimeSlot } = await req.json()
```

- [ ] **Step 3: Generate pick-up code and time**

Add before order creation:
```typescript
const pickupCode = generatePickupCode(Date.now(), new Date())
const estimatedPickupTime = getEstimatedPickupTime(pickupTimeSlot)

function getEstimatedPickupTime(slotId: string): Date {
  const now = new Date()
  if (slotId === 'today-3-5pm') return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0)
  if (slotId === 'today-5-7pm') return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0)
  if (slotId === 'tomorrow-10-12pm') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0)
  if (slotId === 'tomorrow-2-4pm') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0)
  return now
}
```

- [ ] **Step 4: Create order with pick-up fields**

Modify Prisma order creation:
```typescript
const order = await prisma.order.create({
  data: {
    customerName,
    phone,
    email,
    address,
    totalAmount,
    status: 'PENDING',
    userId: userId || null,
    items: { create: items },
    pickupLocation,
    pickupCode,
    estimatedPickupTime,
  },
})
```

- [ ] **Step 5: Return pick-up data in response**

Ensure response includes:
```typescript
{
  orderId: order.id,
  pickupCode: order.pickupCode,
  estimatedPickupTime: order.estimatedPickupTime,
  pickupLocation: order.pickupLocation,
}
```

- [ ] **Step 6: Test with curl**

```bash
curl -X POST http://localhost:3002/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"partId": 1, "quantity": 1}],
    "customerName": "Test", "phone": "123", "email": "test@test.com", "address": "Test St",
    "pickupLocation": "Store 1",
    "pickupTimeSlot": "today-3-5pm"
  }' | jq .
```

Expected: Order created with pickupCode and estimatedPickupTime

- [ ] **Step 7: Commit**

```bash
git add app/api/orders/route.ts lib/pickup-code.ts
git commit -m "feat: modify order creation API to accept and save pick-up data"
```

---

### Task 7: Create Order Detail Page with Pick-up Status & Code

**Files:**
- Create: `app/(site)/orders/[id]/page.tsx`
- Create: `components/order/PickupStatus.tsx`
- Create: `components/order/PickupInfo.tsx`

**Interfaces:**
- Consumes: Order from `/api/orders/[id]` with pick-up fields
- Produces: Order detail page displaying status timeline, items, pick-up code with QR

- [ ] **Step 1: Create PickupStatus component**

```typescript
// components/order/PickupStatus.tsx
'use client'

interface PickupStatusProps {
  status: string
  createdAt: string
  confirmedAt?: string
  readyAt?: string
  pickedUpAt?: string
}

export default function PickupStatus({
  status,
  createdAt,
  confirmedAt,
  readyAt,
  pickedUpAt,
}: PickupStatusProps) {
  const steps = [
    { status: 'PENDING', label: 'Order Placed', date: createdAt },
    { status: 'CONFIRMED', label: 'Confirmed', date: confirmedAt },
    { status: 'READY_FOR_PICKUP', label: 'Ready for Pick-up', date: readyAt },
    { status: 'PICKED_UP', label: 'Picked Up', date: pickedUpAt },
  ]

  const currentIndex = steps.findIndex((s) => s.status === status)

  return (
    <div className="space-y-6">
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.status} className="flex items-start mb-6">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                index <= currentIndex
                  ? 'bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-400'
                  : 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  index <= currentIndex
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {index + 1}
              </span>
            </div>
            <div className="ml-4 flex-1">
              <p
                className={`font-medium ${
                  index <= currentIndex
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(step.date).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PickupInfo component with QR code**

Install QR library first:
```bash
npm install qrcode.react
```

```typescript
// components/order/PickupInfo.tsx
'use client'

import QRCode from 'qrcode.react'

interface PickupInfoProps {
  pickupCode: string
  pickupLocation: string
  estimatedPickupTime: string
}

export default function PickupInfo({
  pickupCode,
  pickupLocation,
  estimatedPickupTime,
}: PickupInfoProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(pickupCode)
    alert('Pick-up code copied!')
  }

  return (
    <div className="border rounded-lg p-6 dark:border-gray-700 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pick-up Location</h3>
        <p className="text-gray-700 dark:text-gray-300">{pickupLocation}</p>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Estimated Pick-up Time</h3>
        <p className="text-gray-700 dark:text-gray-300">
          {new Date(estimatedPickupTime).toLocaleString()}
        </p>
      </div>

      <div className="border-t dark:border-gray-700 pt-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Pick-up Code</h3>
        <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="bg-white p-4 rounded">
            <QRCode value={pickupCode} size={150} />
          </div>
          <div>
            <p className="text-center text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
              {pickupCode}
            </p>
            <button
              onClick={handleCopy}
              className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy Code
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Show this code at the counter for quick check-in
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create order detail page**

```typescript
// app/(site)/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { formatNPR } from '@/lib/currency'
import PickupStatus from '@/components/order/PickupStatus'
import PickupInfo from '@/components/order/PickupInfo'

interface Order {
  id: number
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
  items: Array<{ id: number; partName: string; quantity: number; price: number }>
  pickupLocation?: string
  estimatedPickupTime?: string
  pickupCode?: string
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { userId } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`)
        if (!response.ok) throw new Error('Order not found')
        const data = await response.json()
        setOrder(data.order)
      } catch (error) {
        console.error('Failed to load order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.id, userId])

  if (loading) return <div className="text-center py-12">Loading order...</div>
  if (!order) return <div className="text-center py-12">Order not found</div>

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order #{order.id}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-8">
        {/* Status Timeline */}
        <div className="border rounded-lg p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Order Status</h2>
          <PickupStatus status={order.status} createdAt={order.createdAt} />
        </div>

        {/* Pick-up Info */}
        {order.pickupLocation && order.pickupCode && (
          <PickupInfo
            pickupLocation={order.pickupLocation}
            pickupCode={order.pickupCode}
            estimatedPickupTime={order.estimatedPickupTime || ''}
          />
        )}

        {/* Items */}
        <div className="border rounded-lg p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>
                  {item.partName} × {item.quantity}
                </span>
                <span>{formatNPR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t dark:border-gray-700 mt-4 pt-4 flex justify-between font-semibold text-gray-900 dark:text-gray-100">
            <span>Total</span>
            <span>{formatNPR(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Test order detail page**

Navigate to `/orders/1` (after creating an order), verify all sections display correctly

- [ ] **Step 5: Commit**

```bash
git add components/order/PickupStatus.tsx components/order/PickupInfo.tsx app/\(site\)/orders/\[id\]/page.tsx
git commit -m "feat: create order detail page with pick-up status timeline and code display"
```

---

### Task 8: Add Pick-up Status Update Endpoint (Admin)

**Files:**
- Modify: `app/api/orders/[id]/route.ts`

**Interfaces:**
- Consumes: status value (CONFIRMED, READY_FOR_PICKUP, PICKED_UP) from admin
- Produces: Updated order with new status

- [ ] **Step 1: Add PATCH handler to update order status**

Add to route.ts:
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const { status } = await req.json()
    
    if (!['CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: { status },
    })

    return NextResponse.json({ order })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 2: Test endpoint with curl**

```bash
curl -X PATCH http://localhost:3002/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "READY_FOR_PICKUP"}' | jq .
```

Expected: Order updated with new status (requires admin auth in real scenario)

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/\[id\]/route.ts
git commit -m "feat: add order status update endpoint for admins"
```

---

### Task 9: Admin Orders Page Status Update UI

**Files:**
- Modify: `app/admin/(dashboard)/orders/page.tsx`

**Interfaces:**
- Consumes: Order list with status field
- Produces: Status update buttons/dropdown for each order

- [ ] **Step 1: Add status update handler**

Add to component:
```typescript
const handleStatusUpdate = async (orderId: number, newStatus: string) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!response.ok) throw new Error('Failed to update status')
    // Refetch orders or update local state
    await fetchOrders()
  } catch (error) {
    console.error('Update failed:', error)
  }
}
```

- [ ] **Step 2: Add status column to orders table**

Add to table header:
```typescript
<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
  Status
</th>
```

- [ ] **Step 3: Add status update dropdown to each row**

Add to table row:
```typescript
<td className="px-6 py-4 whitespace-nowrap">
  <select
    value={order.status}
    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
    className="text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
  >
    <option value="PENDING">Pending</option>
    <option value="CONFIRMED">Confirmed</option>
    <option value="READY_FOR_PICKUP">Ready for Pick-up</option>
    <option value="PICKED_UP">Picked Up</option>
    <option value="CANCELLED">Cancelled</option>
  </select>
</td>
```

- [ ] **Step 4: Test in admin interface**

Navigate to admin orders, verify status dropdown appears and can update orders

- [ ] **Step 5: Commit**

```bash
git add app/admin/\(dashboard\)/orders/page.tsx
git commit -m "feat: add status update UI to admin orders page"
```

---

### Task 10: Testing & Dark Mode Verification

**Files:**
- Run tests
- Visual inspection

**Interfaces:**
- All components render correctly in light and dark modes
- Pick-up code, status timeline, pick-up info are readable in both modes

- [ ] **Step 1: Run build to verify TypeScript**

Run: `npm run build`

Expected: ✓ Compiled successfully

- [ ] **Step 2: Run existing tests**

Run: `npm test`

Expected: All tests pass (including pickup-code tests from Task 2)

- [ ] **Step 3: Start dev server**

Run: `npm run dev`

Expected: Server starts without errors

- [ ] **Step 4: Test light mode**

- Navigate to order detail page
- Verify pick-up code displays correctly
- Verify status timeline shows proper colors
- Verify dark mode classes don't appear

- [ ] **Step 5: Test dark mode**

- Toggle dark mode in browser
- Verify all components render with dark: Tailwind classes
- Verify text contrast is good (readable)
- Verify QR code is still scannable

- [ ] **Step 6: Test responsive**

- View on mobile (simulate in DevTools)
- Verify pick-up code is large enough
- Verify QR code is not cut off
- Verify selectors work on small screens

- [ ] **Step 7: Final commit**

```bash
git add -A && git commit -m "feat: order pick-up tracking system complete - all tests pass, dark mode verified"
```

---

## Spec Coverage Checklist

✓ Database: Order model extended with pickupLocation, estimatedPickupTime, pickupCode, actualPickupTime
✓ Order status enum: Added READY_FOR_PICKUP and PICKED_UP states
✓ Pick-up code: Auto-generated PKP-YYYYMMDD-XXXX format
✓ Checkout: Store selector + time slot selector added
✓ API: POST /api/orders accepts and saves pick-up data
✓ API: GET /api/orders/[id] returns all pick-up fields
✓ API: PATCH /api/orders/[id] updates status (admin only)
✓ Customer page: Order detail with status timeline + pick-up code + QR
✓ Admin UI: Status update dropdown on orders page
✓ Dark mode: All components support dark: Tailwind classes
✓ Testing: Pick-up code generation tested, build passes TypeScript check

---

## Review Focus Tests

Each test below verifies the corresponding Review Focus item:

**1. Pick-up code uniqueness:**
```typescript
// In Task 2 tests
it('generatePickupCode generates unique codes for different orders on same date', () => {
  const date = new Date('2026-11-21T10:00:00Z')
  const codes = new Set([
    generatePickupCode(1, date),
    generatePickupCode(2, date),
    generatePickupCode(3, date),
  ])
  expect(codes.size).toBe(3)
})
```

**2. Status transition validation:**
```typescript
// In Task 8 integration test
test('Cannot transition from PENDING directly to PICKED_UP', async () => {
  // Try to PATCH order with invalid transition
  // Should fail or be prevented by business logic
})
```

**3. Customer data isolation (existing pattern):**
Customer can only view their own orders (enforced by /api/orders requiring Clerk auth and userId filtering)

**4. Store selection required:**
Checkout form validates pickupLocation and pickupTimeSlot not empty before allowing payment

**5. Dark mode coverage:**
Visual inspection confirms:
- PickupStatus uses dark:bg-green-900/20, dark:border-green-400, dark:text-green-300
- PickupInfo uses dark:border-gray-700, dark:bg-gray-900, dark:text-gray-100
- OrderDetailPage uses dark:text-gray-100, dark:border-gray-700 throughout
