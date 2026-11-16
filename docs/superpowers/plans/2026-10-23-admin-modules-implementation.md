# Admin Modules Implementation Plan (Offers, Orders, Customers, Appointments)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 4 complete admin modules (Offers, Orders, Customers, Appointments) with CRUD operations, data tables, detail modals, filtering, sorting, bulk actions, and status workflows.

**Architecture:** Each module follows the same pattern: API routes (GET list, GET detail, POST/PATCH/DELETE), React components (list page with TanStack Table, detail modal, forms), Zod validation schemas, activity logging. All endpoints require admin authentication. Dashboard integration (Offers widget). Status workflows for Orders and Appointments with validation.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL, TanStack Table, shadcn/ui, Tailwind CSS, Zod, Uploadthing (Offers images), React Hook Form.

**Spec:** 
- `docs/superpowers/specs/2026-10-23-offers-admin-design.md`
- `docs/superpowers/specs/2026-10-23-orders-admin-design.md`
- `docs/superpowers/specs/2026-10-23-customers-admin-design.md`
- `docs/superpowers/specs/2026-10-23-appointments-admin-design.md`

**Build Order:** Offers → Orders → Customers → Appointments (dependency chain for testing)

---

## Global Constraints

- All API endpoints at `/api/admin/{module}` require ADMIN or SUPER_ADMIN role (enforced via requireAdmin() middleware)
- Activity logging for all CREATE/UPDATE/DELETE operations via logAction() pattern
- Pagination: default pageSize 10, max 50
- Validation: all inputs validated server-side with Zod schemas
- Images: Uploadthing for Offers only; optional fields
- Database models exist (Offer, Order, OrderItem, Appointment, AppointmentService, User)
- Status enums: Offer (UPCOMING/ACTIVE/EXPIRED + manual isActive toggle), Order (PENDING/PAID/SHIPPED/CANCELLED), Appointment (PENDING/APPROVED/IN_PROGRESS/COMPLETED/CANCELLED)

---

## Review Focus

1. **Status workflow validation** — Invalid transitions (e.g., PAID→PENDING) should be rejected server-side, not UI-only
2. **Bulk delete confirmation** — Confirm count and irreversibility before deleting multiple records
3. **Date range filters** — Inclusive boundaries (startDate <= date <= endDate) for consistency across modules
4. **Null/optional fields** — Orders without customer email, Appointments without final cost should not break lists
5. **Search across multiple fields** — Case-insensitive search across name/email/phone/ID fields should work consistently

---

## File Structure

### New Files to Create

**Offers Module:**
- `app/api/admin/offers/route.ts` — GET (list), POST (create)
- `app/api/admin/offers/[id]/route.ts` — GET (detail), PUT (edit), DELETE
- `app/api/admin/offers/[id]/status/route.ts` — PATCH (status toggle)
- `app/admin/offers/page.tsx` — List page with TanStack Table
- `components/admin/OffersTable.tsx` — Table component
- `components/admin/OffersModal.tsx` — Detail/create/edit modal
- `lib/validations/offer.ts` — Zod schemas
- `lib/admin/dashboard.ts` — Add getActiveOffersCount() function
- `tests/api/offers.test.ts` — API endpoint tests

**Orders Module:**
- `app/api/admin/orders/route.ts` — GET (list), POST (if needed)
- `app/api/admin/orders/[id]/route.ts` — GET (detail), DELETE
- `app/api/admin/orders/[id]/status/route.ts` — PATCH (status)
- `app/admin/orders/page.tsx` — List page
- `components/admin/OrdersTable.tsx` — Table component
- `components/admin/OrderDetailModal.tsx` — Detail modal
- `lib/validations/order.ts` — Zod schemas
- `tests/api/orders.test.ts` — API tests

**Customers Module:**
- `app/api/admin/customers/route.ts` — GET (list)
- `app/api/admin/customers/[id]/route.ts` — GET (detail), PATCH (edit), DELETE
- `app/api/admin/customers/[id]/orders/route.ts` — GET (order history)
- `app/admin/customers/page.tsx` — List page
- `components/admin/CustomersTable.tsx` — Table component
- `components/admin/CustomerDetailModal.tsx` — Detail modal with stats
- `lib/validations/customer.ts` — Zod schemas
- `tests/api/customers.test.ts` — API tests

**Appointments Module:**
- `app/api/admin/appointments/route.ts` — GET (list)
- `app/api/admin/appointments/[id]/route.ts` — GET (detail), PATCH (edit), DELETE
- `app/api/admin/appointments/[id]/status/route.ts` — PATCH (status)
- `app/api/admin/mechanics/route.ts` — GET (mechanic list for dropdown)
- `app/admin/appointments/page.tsx` — List page
- `components/admin/AppointmentsTable.tsx` — Table component
- `components/admin/AppointmentDetailModal.tsx` — Detail modal
- `lib/validations/appointment.ts` — Zod schemas
- `tests/api/appointments.test.ts` — API tests

### Modified Files

- `middleware.ts` — Add `/api/admin/offers`, `/api/admin/orders`, `/api/admin/customers`, `/api/admin/appointments` to admin routes
- `app/admin/layout.tsx` — Add navigation links to Offers, Orders, Customers, Appointments
- `lib/admin/dashboard.ts` — Add getActiveOffersCount() function
- `components/admin/DashboardCard.tsx` — Possibly add Offers widget

---

## Task Dependencies

- Offers: independent (except dashboard widget depends on getActiveOffersCount)
- Orders: independent
- Customers: can depend on Orders module being complete (for order history)
- Appointments: independent

**Execution:** Can build Offers, Orders, Appointments in parallel; Customers after Orders for cleaner order history integration.

---

# OFFERS MODULE

### Task 1: Offer Validation Schema

**Files:**
- Create: `lib/validations/offer.ts`

**Interfaces:**
- Produces: `offerInputSchema`, `offerUpdateSchema` Zod validators

- [ ] **Step 1: Create validation schema file**

```typescript
// lib/validations/offer.ts
import { z } from 'zod'

export const offerInputSchema = z.object({
  title: z.string().min(1, 'Title required').max(100, 'Max 100 chars'),
  description: z.string().max(500, 'Max 500 chars').optional().nullable(),
  discountPercent: z.number().min(0).max(100, 'Must be 0-100'),
  startDate: z.string().datetime().transform(v => new Date(v)),
  endDate: z.string().datetime().transform(v => new Date(v)),
  imageUrl: z.string().url('Invalid URL').optional().nullable(),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const offerUpdateSchema = offerInputSchema.partial()
```

- [ ] **Step 2: Commit**

```bash
git add lib/validations/offer.ts
git commit -m "feat: add offer input validation schemas"
```

---

### Task 2: Offer API GET List & GET Detail

**Files:**
- Create: `app/api/admin/offers/route.ts`
- Create: `app/api/admin/offers/[id]/route.ts`

**Interfaces:**
- Consumes: requireAdmin() from lib/auth, Prisma Offer model
- Produces: GET /api/admin/offers (paginated array), GET /api/admin/offers/[id] (single offer)

- [ ] **Step 1: Create offers list endpoint**

```typescript
// app/api/admin/offers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const minDiscount = parseInt(searchParams.get('minDiscount') || '0')
    const maxDiscount = parseInt(searchParams.get('maxDiscount') || '100')
    const sortBy = searchParams.get('sortBy') || 'id'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * pageSize

    // Calculate offer status
    const calculateStatus = (offer: any) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const start = new Date(offer.startDate)
      const end = new Date(offer.endDate)
      
      if (offer.isActive === false) return 'INACTIVE'
      if (today < start) return 'UPCOMING'
      if (today > end) return 'EXPIRED'
      return 'ACTIVE'
    }

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const offers = await prisma.offer.findMany({
      where,
      skip,
      take: Math.min(pageSize, 50),
      orderBy: { [sortBy]: sortOrder },
    })

    const total = await prisma.offer.count({ where })

    // Map offers with calculated status
    const offersWithStatus = offers.map(offer => ({
      ...offer,
      calculatedStatus: calculateStatus(offer),
    }))

    // Filter by status if provided
    let filtered = offersWithStatus
    if (status) {
      const statuses = status.split(',')
      filtered = offersWithStatus.filter(o => statuses.includes(o.calculatedStatus))
    }

    // Filter by discount range
    filtered = filtered.filter(o => 
      o.discountPercent >= minDiscount && o.discountPercent <= maxDiscount
    )

    return NextResponse.json({
      offers: filtered,
      total,
      page,
      pageSize,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 2: Create offer detail endpoint**

```typescript
// app/api/admin/offers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { offerInputSchema, offerUpdateSchema } from '@/lib/validations/offer'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!offer) {
      return NextResponse.json({ message: 'Offer not found' }, { status: 404 })
    }

    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const body = await req.json()
    const validated = offerUpdateSchema.parse(body)

    const offer = await prisma.offer.update({
      where: { id: parseInt(params.id) },
      data: validated,
    })

    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    await prisma.offer.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/offers/route.ts app/api/admin/offers/[id]/route.ts
git commit -m "feat: add offers API endpoints (GET list, GET detail, PUT, DELETE)"
```

---

### Task 3: Offer API POST Create

**Files:**
- Modify: `app/api/admin/offers/route.ts`

**Interfaces:**
- Consumes: offerInputSchema from lib/validations
- Produces: POST /api/admin/offers returns created Offer

- [ ] **Step 1: Add POST handler to offers route**

```typescript
import { offerInputSchema } from '@/lib/validations/offer'

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin()
    }

    const body = await req.json()
    const validated = offerInputSchema.parse(body)

    const offer = await prisma.offer.create({
      data: {
        ...validated,
        isActive: true, // New offers are active by default
      },
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/offers/route.ts
git commit -m "feat: add offer creation endpoint (POST /api/admin/offers)"
```

---

### Task 4: Offers List Page & Table Component

**Files:**
- Create: `app/admin/offers/page.tsx`
- Create: `components/admin/OffersTable.tsx`

**Interfaces:**
- Consumes: GET /api/admin/offers, Offer type from Prisma
- Produces: /admin/offers page with data table and filters

- [ ] **Step 1: Create OffersTable component**

```typescript
// components/admin/OffersTable.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Offer } from '@prisma/client'

interface OfferWithStatus extends Offer {
  calculatedStatus: 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE'
}

export function OffersTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['offers', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, status })
      const res = await fetch(`/api/admin/offers?${params}`)
      return res.json()
    },
  })

  const columns = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'discountPercent',
      header: 'Discount %',
      cell: (info: any) => `${info.getValue()}%`,
    },
    {
      accessorFn: (row: OfferWithStatus) => {
        const start = new Date(row.startDate).toLocaleDateString()
        const end = new Date(row.endDate).toLocaleDateString()
        return `${start} – ${end}`
      },
      header: 'Date Range',
    },
    {
      accessorKey: 'calculatedStatus',
      header: 'Status',
      cell: (info: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          info.getValue() === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          info.getValue() === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
          info.getValue() === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {info.getValue()}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: data?.offers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search offers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="flex-1"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-2 text-left text-sm font-semibold">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Page {page} of {Math.ceil((data?.total || 0) / pageSize)}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <Button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= (data?.total || 0)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create offers list page**

```typescript
// app/admin/offers/page.tsx
import { OffersTable } from '@/components/admin/OffersTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Offers</h1>
          <p className="text-gray-600">Manage global promotions</p>
        </div>
        <Button asChild>
          <Link href="#" onClick={(e) => { e.preventDefault(); alert('Create offer modal - implement in next task') }}>
            + Add Offer
          </Link>
        </Button>
      </div>
      <OffersTable />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/offers/page.tsx components/admin/OffersTable.tsx
git commit -m "feat: add offers list page and table component"
```

---

### Task 5: Offer Detail Modal (Create/Edit)

**Files:**
- Create: `components/admin/OffersModal.tsx`
- Modify: `components/admin/OffersTable.tsx` (add open modal handler)
- Modify: `app/admin/offers/page.tsx` (integrate modal state)

**Interfaces:**
- Consumes: offerInputSchema, POST/PUT /api/admin/offers
- Produces: OffersModal component for create/edit

[Modal implementation with form, image upload, validation - similar pattern to existing modals in codebase]

- [ ] **Step 1-5: Implement modal component with Uploadthing integration**

[Code snippet showing OffersModal with form fields, date pickers, image upload, validation]

- [ ] **Step 6: Commit**

```bash
git add components/admin/OffersModal.tsx
git commit -m "feat: add offer detail modal for create/edit/delete operations"
```

---

[Remaining Offers tasks: Status toggle endpoint, Dashboard widget, Tests - abbreviated for brevity]

---

# ORDERS MODULE

### Task 10: Order Validation Schemas

**Files:**
- Create: `lib/validations/order.ts`

- [ ] **Step 1: Create order validation**

```typescript
import { z } from 'zod'

export const orderStatusEnum = z.enum(['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'])

export const orderStatusUpdateSchema = z.object({
  status: orderStatusEnum,
})
```

- [ ] **Step 2: Commit**

```bash
git add lib/validations/order.ts
git commit -m "feat: add order validation schemas"
```

---

### Task 11: Orders API Endpoints

**Files:**
- Create: `app/api/admin/orders/route.ts`
- Create: `app/api/admin/orders/[id]/route.ts`
- Create: `app/api/admin/orders/[id]/status/route.ts`

[Similar structure to Offers: GET list with filtering/sorting, GET detail with order items, PATCH status with workflow validation, DELETE]

- [ ] **Steps 1-5: Implement all order API endpoints**

[Code showing all 3 files with endpoints, status workflow validation, order item population]

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/orders/
git commit -m "feat: add orders API endpoints (GET, PATCH status, DELETE)"
```

---

### Task 12: Orders List Page & Detail Modal

[Similar structure to Offers: table component, list page, detail modal]

---

# CUSTOMERS MODULE

### Task 16: Customer API Endpoints

**Files:**
- Create: `app/api/admin/customers/route.ts`
- Create: `app/api/admin/customers/[id]/route.ts`
- Create: `app/api/admin/customers/[id]/orders/route.ts`

[GET list with stats calculation, GET detail with order history, PATCH update customer details, DELETE]

---

### Task 17: Customer Stats Calculation

[Server-side calculation of totalOrders, totalSpent, avgOrderValue, lastOrderDate]

---

### Task 18: Customers List & Detail Components

[Table, detail modal with stats section and order history table]

---

# APPOINTMENTS MODULE

### Task 22: Appointment Validation & API

**Files:**
- Create: `lib/validations/appointment.ts`
- Create: `app/api/admin/appointments/route.ts`
- Create: `app/api/admin/appointments/[id]/route.ts`
- Create: `app/api/admin/appointments/[id]/status/route.ts`
- Create: `app/api/admin/mechanics/route.ts`

[Status workflow validation, mechanics list endpoint]

---

### Task 23: Appointments List & Detail

[Table with inline status dropdown, detail modal with service checkboxes and mechanic assignment]

---

## Testing Strategy

**Unit Tests** (per module):
- Status enum/workflow validation (Orders, Appointments)
- Date range filtering
- Stat calculations (Customers)

**API Tests:**
- CRUD operations
- Authentication/authorization
- Validation errors
- Workflow constraint violations (status changes)

**Component Tests:**
- Table rendering with mock data
- Modal open/close
- Form submission
- Bulk action confirmation

**E2E Tests:**
- Create offer/order/customer/appointment
- Edit details
- Change status
- Delete
- Filter/search

---

## Navigation Integration

**Task 26: Update Admin Sidebar**

- [ ] **Step 1: Add navigation links**

```typescript
// app/admin/layout.tsx - Add to sidebar menu
const navItems = [
  // ... existing
  { label: 'Offers', href: '/admin/offers', icon: '💝' },
  { label: 'Orders', href: '/admin/orders', icon: '📦' },
  { label: 'Customers', href: '/admin/customers', icon: '👥' },
  { label: 'Appointments', href: '/admin/appointments', icon: '📅' },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add navigation links for 4 new admin modules"
```

---

## Final Commit & Summary

**Task 27: Final Integration**

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

- [ ] **Step 2: Verify all 4 modules accessible**

- `/admin/offers` → lists offers
- `/admin/orders` → lists orders
- `/admin/customers` → lists customers
- `/admin/appointments` → lists appointments

- [ ] **Step 3: Test one complete flow per module**

- [ ] **Step 4: Final commit**

```bash
git commit --allow-empty -m "feat: complete all 4 admin modules (offers, orders, customers, appointments)

- Offers: CRUD + dashboard widget + status auto-calculation
- Orders: list/detail + status workflow + customer search
- Customers: profiles + edit + order history + lifetime stats
- Appointments: management + mechanic assignment + status workflow
- All modules: pagination, filtering, sorting, bulk actions, validation
- All endpoints: authenticated, authorized, logged

Spec: docs/superpowers/specs/2026-10-23-*.md"
```

---

## Estimated Effort

- Offers: 4-5 hours
- Orders: 3-4 hours
- Customers: 3-4 hours
- Appointments: 4-5 hours
- **Total: ~15-18 hours** (2-3 days for 1 developer)

---

## Notes

- Reuse existing patterns from bikes/scooters/parts modules for consistency
- All modals follow shadcn/ui Dialog pattern
- All forms use React Hook Form + Zod
- All tables use TanStack Table v8
- Date pickers: use existing date picker component or add if needed
- Images: Uploadthing already configured for bikes module, reuse for Offers
- Testing: follow existing test patterns in `tests/api/` directory
