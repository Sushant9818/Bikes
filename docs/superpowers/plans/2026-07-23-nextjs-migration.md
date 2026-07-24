# Suzuki Bike System: Spring Boot → Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Spring Boot backend and React/Vite frontend with a single full-stack Next.js (App Router) application, built fresh in `web/`, then cut over.

**Architecture:** Next.js 15 App Router + TypeScript. Route Handlers under `web/app/api/` replace Spring controllers. Server/Client Components under `web/app/` replace the React Router SPA. Prisma (introspected from the existing Supabase schema) replaces JPA/Hibernate. Clerk replaces custom JWT + Twilio-gated auth. Stripe and the appointment/order/catalog domain logic port 1:1.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui primitives, Prisma + PostgreSQL (Supabase), Clerk (auth), Stripe (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`), Resend + react-email, Zod, Vitest, Playwright.

Full design context: `docs/superpowers/specs/2026-07-23-nextjs-migration-design.md`.

## Global Constraints

- Same Supabase Postgres instance reused; Prisma schema is introspected via `prisma db pull` conceptually, then hand-fixed to the shape defined in Task 3 — no data migration.
- `users` table: add unique `clerk_user_id`; drop `password`, `phone_verified`, `email_verified_at`; keep `role`, `email`, `phone_number` (now unverified). Drop `verification_tokens` and `password_reset_tokens` tables entirely.
- Auth is Clerk: email + password primary sign-in; phone verification is an optional secondary factor via Clerk's phone strategy (BYO Twilio, configured in the Clerk dashboard — no custom OTP code in this repo).
- Role (`ADMIN`/`CLIENT`) lives in Clerk `publicMetadata.role`, exposed in the session JWT via a Clerk JWT template, and mirrored into the local `User.role` column by a webhook. Clerk is always the source of truth.
- Stripe flow is a 1:1 port: `create-intent` re-validates cart items server-side (never trusts client-sent prices), creates an `Order` draft (`PENDING`), creates a PaymentIntent; the webhook finalizes on `payment_intent.succeeded` (reduce stock inside a transaction, set `PAID`, send emails; insufficient stock after payment routes to `PAYMENT_REVIEW`).
- Email: only 3 business emails (order confirmation to customer, new-order alert to admin, low-stock alert to admin) via Resend + react-email, gated by a `MAIL_ENABLED` env toggle (default false). Clerk owns verification/password-reset emails — do not build those.
- UI is a faithful port of the existing Tailwind + shadcn/ui design (`#E60012` red brand color, same card/layout structure) — no redesign.
- New app is built entirely under a new top-level `web/` directory. Do not modify `frontend/app` or `server` until the final cutover task.
- Package manager: npm. Testing: Vitest for unit/integration (route handlers, lib functions), Playwright for the critical e2e flows listed in Task 23. Every task that adds route handlers or non-trivial lib logic includes tests in the same task.
- Every Route Handler follows the same error-handling contract defined in Task 1 (`lib/api-error.ts`'s `handleApiError`) and the same auth contract defined in Task 5 (`lib/auth.ts`'s `requireUser`/`requireAdmin`).

## File Structure Overview

```
web/
  app/
    api/
      vehicles/route.ts, [id]/route.ts
      parts/route.ts, [id]/route.ts
      offers/route.ts, [id]/route.ts
      orders/route.ts, my/route.ts, [id]/status/route.ts
      payments/create-intent/route.ts, webhook/route.ts
      appointments/route.ts, my/route.ts, stats/route.ts, [id]/route.ts,
        [id]/status/route.ts, [id]/reschedule/route.ts, [id]/cancel/route.ts
      contact/route.ts
      test-drive/route.ts
      analytics/summary/route.ts
      admin/users/route.ts, [id]/route.ts, [id]/role/route.ts, [id]/enable/route.ts
      users/me/route.ts
      webhooks/clerk/route.ts
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
    (site)/layout.tsx, page.tsx, bikes/page.tsx, scooters/page.tsx,
      products/[id]/page.tsx, parts/page.tsx, parts/[id]/page.tsx,
      cart/page.tsx, checkout/page.tsx, checkout/success/page.tsx,
      offers/page.tsx, test-drive/page.tsx, contact/page.tsx,
      book-service/page.tsx, my-appointments/page.tsx,
      appointments/[id]/page.tsx, my-orders/page.tsx, profile/page.tsx,
      admin/orders/page.tsx, admin/analytics/page.tsx, admin/users/page.tsx,
      admin/appointments/page.tsx
    layout.tsx (root, ClerkProvider)
    globals.css
  components/
    ui/ (badge, button, dialog, dropdown-menu, input, label, skeleton, table, tabs, textarea)
    Navbar.tsx, Footer.tsx, LoadingSpinner.tsx, HeroSection.tsx, ProductCard.tsx,
    PartCard.tsx, CategoryTabs.tsx, AdminCardActions.tsx, ConfirmDeleteDialog.tsx,
    AddEditModal.tsx, DataTable.tsx, SkeletonGrid.tsx, StatsRow.tsx
  cart/CartContext.tsx
  lib/
    prisma.ts, auth.ts, api-error.ts, utils.ts, currency.ts, images.ts,
    catalogDescriptions.ts, email.ts, validations/*.ts
  emails/
    OrderConfirmationCustomer.tsx, OrderAlertAdmin.tsx, LowStockAlert.tsx
  prisma/schema.prisma
  middleware.ts
  tests/ (vitest specs mirror app/lib structure)
  e2e/ (playwright specs)
```

---

### Task 1: Next.js scaffold, base config, shared error/util libs

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.ts`
- Create: `web/postcss.config.mjs`
- Create: `web/app/globals.css`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx` (temporary placeholder, replaced in Task 8)
- Create: `web/.env.example`
- Create: `web/lib/utils.ts`
- Create: `web/lib/api-error.ts`
- Create: `web/lib/currency.ts`
- Create: `web/lib/catalogDescriptions.ts`
- Create: `web/lib/images.ts`
- Create: `web/vitest.config.ts`
- Test: `web/tests/lib/currency.test.ts`
- Test: `web/tests/lib/api-error.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `lib/utils.ts`; `formatNPR(amount: number | null | undefined): string` and `PLACEHOLDER_IMAGE: string` from `lib/currency.ts`/`lib/images.ts`; `getImageUrl(item: { modelName?: string; type?: string; id?: number; imageUrl?: string | null }): string` from `lib/images.ts`; `vehicleDescription`, `partDescription`, `vehicleTypeLabel`, `partCategoryLabel` from `lib/catalogDescriptions.ts`; `class ApiError extends Error { status: number }` and `handleApiError(err: unknown): Response` from `lib/api-error.ts`.

- [ ] **Step 1: Scaffold the Next.js app**

Run from the repo root:

```bash
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm
```

When prompted, accept all defaults. This creates `web/` with `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `app/globals.css`, `postcss.config.mjs`.

- [ ] **Step 2: Install additional dependencies**

```bash
cd web
npm install zod clsx tailwind-merge class-variance-authority lucide-react
npm install -D vitest @vitejs/plugin-react @testing-library/react jsdom @types/node
```

- [ ] **Step 3: Add `web/.env.example`**

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_CURRENCY=usd
RESEND_API_KEY=
MAIL_FROM=noreply@example.com
MAIL_ENABLED=false
ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Write `web/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Write `web/lib/currency.ts`**

```typescript
export function formatNPR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rs 0'
  const n = Number(amount)
  if (Number.isNaN(n)) return `Rs ${amount}`
  return `Rs ${n.toLocaleString('en-IN')}`
}
```

- [ ] **Step 6: Write the failing test for currency**

`web/tests/lib/currency.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { formatNPR } from '@/lib/currency'

describe('formatNPR', () => {
  it('formats a positive number with Indian-style grouping', () => {
    expect(formatNPR(1234567)).toBe('Rs 12,34,567')
  })

  it('returns "Rs 0" for null or undefined', () => {
    expect(formatNPR(null)).toBe('Rs 0')
    expect(formatNPR(undefined)).toBe('Rs 0')
  })

  it('falls back to raw value for non-numeric input', () => {
    expect(formatNPR(Number('abc'))).toBe('Rs NaN')
  })
})
```

- [ ] **Step 7: Add `web/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Add to `web/package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 8: Run the currency test, verify it passes**

Run: `cd web && npm test -- tests/lib/currency.test.ts`
Expected: 3 passed

- [ ] **Step 9: Write `web/lib/images.ts`**

```typescript
export const PLACEHOLDER_IMAGE = '/assets/images/placeholder.jpg'

const BIKE_NAME_MAP: { keys: string[]; img: string }[] = [
  { keys: ['gixxer 155 fi', 'gixxer155 fi', 'gixxer 155fi'], img: '/assets/images/bikes/gixxer-155-blue.jpg' },
  { keys: ['gixxer 155'], img: '/assets/images/bikes/gixxer-155-orange.jpg' },
  { keys: ['v-strom sx 250', 'vstrom sx 250', 'v strom sx'], img: '/assets/images/bikes/vstrom-sx-250.jpg' },
  { keys: ['v-strom 250', 'vstrom 250', 'v strom 250'], img: '/assets/images/bikes/vstrom-sx-250.jpg' },
  { keys: ['v-strom', 'vstrom'], img: '/assets/images/bikes/vstrom-sx-250.jpg' },
  { keys: ['gixxer sf 250 moto gp', 'sf 250 moto gp'], img: '/assets/images/bikes/gixxer-sf-250-motogp.png' },
  { keys: ['gixxer sf 250'], img: '/assets/images/bikes/gixxer-sf-250-std.png' },
  { keys: ['gixxer sf 150 moto gp', 'sf 150 moto gp'], img: '/assets/images/bikes/gixxer-sf-150-motogp.png' },
  { keys: ['gixxer sf 150', 'sf 150 abs'], img: '/assets/images/bikes/gixxer-sf-150-abs.png' },
  { keys: ['gixxer 250'], img: '/assets/images/bikes/gixxer-250-naked.png' },
  { keys: ['gixxer sf'], img: '/assets/images/bikes/gixxer-sf-150-abs.png' },
  { keys: ['gixxer'], img: '/assets/images/bikes/gixxer-155-fi.png' },
  { keys: ['gsx-s1000gx+', 'gsx-s1000gx', 'gsx s1000'], img: '/assets/images/bikes/gsx-s1000gx.jpg' },
  { keys: ['gsx-8s', 'gsx 8s'], img: '/assets/images/bikes/gsx-8s.webp' },
  { keys: ['intruder 150', 'intruder150'], img: '/assets/images/bikes/intruder-150.png' },
  { keys: ['intruder'], img: '/assets/images/bikes/intruder-150.png' },
  { keys: ['hayate'], img: '/assets/images/bikes/hayate.png' },
  { keys: ['hayabusa'], img: '/assets/images/bikes/gsx-s1000gx.jpg' },
]

const SCOOTER_NAME_MAP: { keys: string[]; img: string }[] = [
  { keys: ['access 125 fi sp', 'access 125 fi special', 'access 125 fi'], img: '/assets/images/scooters/access-125-fi.jpg' },
  { keys: ['access 125', 'access125'], img: '/assets/images/scooters/access-125-fi.jpg' },
  { keys: ['access'], img: '/assets/images/scooters/access-125-fi.jpg' },
  { keys: ['avenis 125 fi', 'avenis125 fi', 'avenis 125'], img: '/assets/images/scooters/avenis-125-fi.jpg' },
  { keys: ['avenis'], img: '/assets/images/scooters/avenis-125-fi.jpg' },
  { keys: ['burgman 125 fi', 'burgman125 fi', 'burgman 125'], img: '/assets/images/scooters/burgman-125-fi.jpg' },
  { keys: ['burgman street 125', 'burgman street'], img: '/assets/images/scooters/burgman-street-125.png' },
  { keys: ['burgman'], img: '/assets/images/scooters/burgman-125-fi.jpg' },
]

const BIKE_FALLBACKS = [
  '/assets/images/bikes/gixxer-155-blue.jpg',
  '/assets/images/bikes/gixxer-155-orange.jpg',
  '/assets/images/bikes/gixxer-sf-150-abs.png',
  '/assets/images/bikes/vstrom-sx-250.jpg',
]

const SCOOTER_FALLBACKS = [
  '/assets/images/scooters/avenis-125-fi.jpg',
  '/assets/images/scooters/burgman-125-fi.jpg',
  '/assets/images/scooters/access-125-fi.jpg',
]

interface ImageableItem {
  modelName?: string | null
  type?: string | null
  id?: number | null
  imageUrl?: string | null
}

function autoImage(item: ImageableItem): string {
  const name = (item.modelName ?? '').toLowerCase()
  const type = (item.type ?? '').toUpperCase()
  const id = Math.abs(item.id ?? 0)

  const map = type === 'SCOOTER' ? SCOOTER_NAME_MAP : BIKE_NAME_MAP
  for (const { keys, img } of map) {
    if (keys.some((k) => name.includes(k))) return img
  }

  const fallbacks = type === 'SCOOTER' ? SCOOTER_FALLBACKS : BIKE_FALLBACKS
  return fallbacks[id % fallbacks.length]
}

export function getImageUrl(item: ImageableItem): string {
  const url = item.imageUrl
  if (url && (url.startsWith('/') || url.startsWith('http'))) return url
  if (url) return `/assets/images/${url}`
  return autoImage(item)
}
```

- [ ] **Step 10: Write `web/lib/catalogDescriptions.ts`**

```typescript
const BIKE_SPECS: Record<string, string> = {
  'gixxer 155 fi': '155cc FI · 13.6ps · ABS · LED · 5-speed · 141kg',
  'gixxer 155': '155cc FI · 13.6ps · ABS · LED · 5-speed · 141kg',
  'v-strom sx 250': '249cc FI · 26.5ps · Oil-cooled · 6-speed · 167kg · 205mm clearance',
  'v-strom 250': '249cc FI · 26.5ps · Oil-cooled · 6-speed · 167kg',
  'gixxer sf 250': '250cc FI · Dual-ABS · Full-fairing · 6-speed',
  'gixxer 250': '250cc FI · Dual-ABS · Naked · 6-speed',
  'gixxer sf 150': '155cc FI · ABS · Full-fairing · 5-speed',
  gixxer: '155cc FI · 13.6ps · ABS · 5-speed',
  'intruder 150': '155cc · Cruiser · Fuel Injection · 5-speed',
}

const SCOOTER_SPECS: Record<string, string> = {
  'access 125 fi sp': '124cc FI · 6.2kW · CVT · Special Edition',
  'access 125 fi': '124cc FI · 6.2kW @ 6500rpm · 10.2Nm · CVT',
  'access 125': '124cc FI · CVT · Air-cooled · SOHC',
  'avenis 125 fi': '124cc FI · 8.7ps @ 6750rpm · 10Nm · CVT',
  avenis: '124cc FI · 8.7ps · CVT',
  'burgman 125 fi': '124cc FI · 8.7ps · CVT · Premium maxi-scooter',
  burgman: '124cc FI · CVT · Premium maxi-scooter',
}

function lookupSpec(name: string, map: Record<string, string>): string | null {
  const lower = name.toLowerCase()
  for (const [key, spec] of Object.entries(map)) {
    if (lower.includes(key)) return spec
  }
  return null
}

interface VehicleLike {
  description?: string | null
  modelName?: string | null
  type?: string | null
  year?: number | null
}

export function vehicleDescription(vehicle: VehicleLike): string {
  if (vehicle.description) return vehicle.description
  const name = vehicle.modelName ?? ''
  const type = vehicle.type === 'SCOOTER' ? 'scooter' : 'motorcycle'
  const spec = vehicle.type === 'SCOOTER' ? lookupSpec(name, SCOOTER_SPECS) : lookupSpec(name, BIKE_SPECS)
  if (spec) return `Suzuki ${name} — ${spec}`
  const year = vehicle.year ?? ''
  return `Premium Suzuki ${type} · ${name}${year ? ` (${year})` : ''}. Available for test rides and purchase at authorized dealers.`
}

interface PartLike {
  description?: string | null
  compatibleModel?: string | null
  type?: string | null
}

export function partDescription(part: PartLike): string {
  if (part.description) return part.description
  const model = part.compatibleModel || 'multiple Suzuki models'
  const category = part.type === 'SCOOTER_PART' ? 'Scooter part' : 'Bike part'
  return `${category} · Fits ${model}. Genuine Suzuki quality and reliability.`
}

export function vehicleTypeLabel(type?: string | null): string {
  if (type === 'SCOOTER') return 'Scooter'
  if (type === 'BIKE') return 'Bike'
  return type || 'Vehicle'
}

export function partCategoryLabel(type?: string | null): string {
  if (type === 'SCOOTER_PART') return 'Scooter Parts'
  if (type === 'BIKE_PART') return 'Bike Parts'
  return 'Parts'
}
```

- [ ] **Step 11: Write `web/lib/api-error.ts`**

```typescript
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ message: err.message }, { status: err.status })
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { message: 'Validation error', errors: err.flatten().fieldErrors },
      { status: 400 }
    )
  }
  console.error('Unhandled API error:', err)
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
}
```

- [ ] **Step 12: Write the failing test for api-error**

`web/tests/lib/api-error.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { z, ZodError } from 'zod'
import { ApiError, handleApiError } from '@/lib/api-error'

describe('handleApiError', () => {
  it('maps ApiError to its status and message', async () => {
    const res = handleApiError(new ApiError(404, 'Vehicle not found'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.message).toBe('Vehicle not found')
  })

  it('maps ZodError to 400 with field errors', async () => {
    const schema = z.object({ price: z.number() })
    let zodError: ZodError | undefined
    try {
      schema.parse({ price: 'not-a-number' })
    } catch (e) {
      zodError = e as ZodError
    }
    const res = handleApiError(zodError)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('Validation error')
    expect(body.errors).toHaveProperty('price')
  })

  it('maps unknown errors to 500', async () => {
    const res = handleApiError(new Error('boom'))
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 13: Run tests, verify all pass**

Run: `cd web && npm test`
Expected: all tests pass (currency + api-error)

- [ ] **Step 14: Replace `web/app/globals.css` with the Tailwind v4 import**

```css
@import "tailwindcss";
```

- [ ] **Step 15: Write placeholder `web/app/page.tsx`** (replaced by the real home page in Task 8)

```typescript
export default function Home() {
  return <div>Suzuki Bike System — under construction</div>
}
```

- [ ] **Step 16: Commit**

```bash
cd web
git add -A
git commit -m "chore: scaffold Next.js app with shared utils and error handling"
```

---

### Task 2: shadcn/ui primitives port

**Files:**
- Create: `web/components/ui/badge.tsx`
- Create: `web/components/ui/button.tsx`
- Create: `web/components/ui/dialog.tsx`
- Create: `web/components/ui/dropdown-menu.tsx`
- Create: `web/components/ui/input.tsx`
- Create: `web/components/ui/label.tsx`
- Create: `web/components/ui/skeleton.tsx`
- Create: `web/components/ui/table.tsx`
- Create: `web/components/ui/tabs.tsx`
- Create: `web/components/ui/textarea.tsx`
- Test: `web/tests/components/ui/button.test.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (Task 1).
- Produces: `Badge`, `Button`/`buttonVariants`, `Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter`/`DialogTitle`/`DialogDescription`, `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem`, `Input`, `Label`, `Skeleton`, `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Textarea` — all consumed by name in later component/page tasks exactly as listed.

- [ ] **Step 1: Install Radix primitives**

```bash
cd web
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-tabs
```

- [ ] **Step 2: Write `web/components/ui/badge.tsx`**

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white',
        secondary: 'bg-zinc-100 text-zinc-900',
        destructive: 'bg-red-100 text-red-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        outline: 'border border-zinc-200',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

- [ ] **Step 3: Write `web/components/ui/button.tsx`**

```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white hover:bg-zinc-800',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border-2 border-zinc-200 bg-transparent hover:bg-zinc-100',
        secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
        ghost: 'hover:bg-zinc-100',
        link: 'text-red-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

- [ ] **Step 4: Write `web/components/ui/dialog.tsx`**

```typescript
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm', className)}
    {...props}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-zinc-200 bg-white p-6 shadow-xl sm:rounded-2xl',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-none', className)} {...props} />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-zinc-500', className)} {...props} />
))
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

- [ ] **Step 5: Write `web/components/ui/dropdown-menu.tsx`**

```typescript
'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xl',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-zinc-100',
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
```

- [ ] **Step 6: Write `web/components/ui/input.tsx`, `label.tsx`, `textarea.tsx`, `skeleton.tsx`**

`web/components/ui/input.tsx`:

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
```

`web/components/ui/label.tsx`:

```typescript
'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70')

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

`web/components/ui/textarea.tsx`:

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }
```

`web/components/ui/skeleton.tsx`:

```typescript
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-xl bg-zinc-200', className)} {...props} />
}

export { Skeleton }
```

- [ ] **Step 7: Write `web/components/ui/table.tsx` and `web/components/ui/tabs.tsx`**

`web/components/ui/table.tsx`:

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
)
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
)
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-zinc-200 transition-colors hover:bg-zinc-50 data-[state=selected]:bg-zinc-100', className)}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-12 px-4 text-left align-middle font-semibold text-zinc-600 [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
)
TableCell.displayName = 'TableCell'

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
```

`web/components/ui/tabs.tsx`:

```typescript
'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('inline-flex h-11 items-center justify-center rounded-xl bg-zinc-100 p-1 text-zinc-600', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2', className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 8: Write the failing test for Button**

`web/tests/components/ui/button.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders children and applies the destructive variant class', () => {
    render(<Button variant="destructive">Delete</Button>)
    const btn = screen.getByRole('button', { name: 'Delete' })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-red-600')
  })
})
```

- [ ] **Step 9: Run tests, verify pass**

Run: `cd web && npm test`
Expected: all tests pass

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: port shadcn/ui primitives to TypeScript"
```

---

### Task 3: Prisma schema, client, and migration

**Files:**
- Create: `web/prisma/schema.prisma`
- Create: `web/lib/prisma.ts`
- Test: `web/tests/lib/prisma.test.ts`

**Interfaces:**
- Produces: `prisma: PrismaClient` singleton from `lib/prisma.ts`, and the following Prisma models (used by name in every later task that touches data): `User`, `Vehicle`, `Part`, `Offer`, `Order`, `OrderItem`, `Appointment`, `AppointmentService`, `TestDriveRequest`, `ContactRequest`; enums `Role`, `VehicleType`, `PartType`, `OrderStatus`, `AppointmentStatus`, `ServiceType`.

- [ ] **Step 1: Install Prisma**

```bash
cd web
npm install @prisma/client
npm install -D prisma
npx prisma init --datasource-provider postgresql
```

This creates `web/prisma/schema.prisma` and adds `DATABASE_URL` to `.env` (already present in `.env.example` from Task 1).

- [ ] **Step 2: Write `web/prisma/schema.prisma`**

Replace the generated file's contents entirely with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  ADMIN
  CLIENT
}

enum VehicleType {
  BIKE
  SCOOTER
}

enum PartType {
  BIKE_PART
  SCOOTER_PART
}

enum OrderStatus {
  PENDING
  PAID
  CONFIRMED
  SHIPPED
  CANCELLED
  PAYMENT_REVIEW
  FAILED
}

enum AppointmentStatus {
  PENDING
  APPROVED
  REJECTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ServiceType {
  OIL_CHANGE
  ENGINE_REPAIR
  TIRE_REPLACEMENT
  BRAKE_SERVICE
  BATTERY_REPLACEMENT
  CHAIN_ADJUSTMENT
  CHAIN_REPLACEMENT
  SUSPENSION_REPAIR
  ELECTRICAL_REPAIR
  GENERAL_INSPECTION
  FULL_SERVICE
  CLUTCH_REPAIR
  GEAR_REPAIR
  COOLING_SYSTEM_REPAIR
  FUEL_SYSTEM_CLEANING
  AIR_FILTER_REPLACEMENT
  SPARK_PLUG_REPLACEMENT
  WHEEL_ALIGNMENT
  WASHING_DETAILING
  OTHER
}

model User {
  id          Int      @id @default(autoincrement())
  clerkUserId String   @unique @map("clerk_user_id")
  username    String   @unique
  email       String   @unique
  phoneNumber String?  @map("phone_number")
  role        Role     @default(CLIENT)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  orders      Order[]

  @@map("users")
}

model Vehicle {
  id          Int         @id @default(autoincrement())
  type        VehicleType
  modelName   String      @map("model_name")
  brand       String      @default("Suzuki")
  year        Int
  price       Float
  quantity    Int
  imageUrl    String?     @map("image_url")
  description String?

  @@map("vehicles")
}

model Part {
  id              Int      @id @default(autoincrement())
  type            PartType
  brand           String   @default("Suzuki")
  partName        String   @map("part_name")
  compatibleModel String?  @map("compatible_model")
  price           Float
  quantity        Int
  imageUrl        String?  @map("image_url")

  orderItems      OrderItem[]

  @@map("parts")
}

model Offer {
  id              Int       @id @default(autoincrement())
  title           String
  description     String?
  discountPercent Float?    @map("discount_percent")
  startDate       DateTime? @map("start_date") @db.Date
  endDate         DateTime? @map("end_date") @db.Date
  imageUrl        String?   @map("image_url")

  @@map("offers")
}

model Order {
  id                    Int         @id @default(autoincrement())
  customerName          String      @map("customer_name")
  phone                 String
  email                 String?
  address               String
  totalAmount           Float       @map("total_amount")
  status                OrderStatus @default(PENDING)
  stripePaymentIntentId String?     @map("stripe_payment_intent_id")
  userId                Int?        @map("user_id")
  user                  User?       @relation(fields: [userId], references: [id])
  createdAt             DateTime    @default(now()) @map("created_at")

  items                 OrderItem[]

  @@map("orders")
}

model OrderItem {
  id       Int    @id @default(autoincrement())
  partId   Int    @map("part_id")
  part     Part   @relation(fields: [partId], references: [id])
  partName String @map("part_name")
  price    Float
  quantity Int
  orderId  Int    @map("order_id")
  order    Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_items")
}

model Appointment {
  id                 Int                  @id @default(autoincrement())
  clientUsername     String               @map("client_username")
  bikeModel          String               @map("bike_model")
  bikeYear           Int?                 @map("bike_year")
  registrationNumber String?              @map("registration_number")
  vin                String?
  mileage            Int?
  customService      String?              @map("custom_service")
  description        String?
  preferredDate      DateTime             @map("preferred_date") @db.Date
  preferredTime      String               @map("preferred_time")
  status             AppointmentStatus    @default(PENDING)
  estimatedCost      Float?               @map("estimated_cost")
  finalCost          Float?               @map("final_cost")
  repairNotes        String?              @map("repair_notes")
  serviceNotes       String?              @map("service_notes")
  mechanicName       String?              @map("mechanic_name")
  createdAt          DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  services           AppointmentService[]

  @@map("appointments")
}

model AppointmentService {
  id            Int         @id @default(autoincrement())
  appointmentId Int         @map("appointment_id")
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  service       ServiceType

  @@map("appointment_services")
}

model TestDriveRequest {
  id            Int       @id @default(autoincrement())
  name          String
  phone         String
  email         String?
  vehicleId     Int?      @map("vehicle_id")
  preferredDate DateTime? @map("preferred_date") @db.Date
  message       String?
  createdAt     DateTime  @default(now()) @map("created_at")

  @@map("test_drive_requests")
}

model ContactRequest {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  phone     String?
  subject   String?
  message   String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("contact_requests")
}
```

- [ ] **Step 3: Set `DATABASE_URL`/`DIRECT_URL` in `web/.env`**

Copy the Supabase connection string from `server/src/main/resources/application-supabase.yml` (the existing production DB the app already uses) into `web/.env`:

```bash
DATABASE_URL="postgresql://postgres:<password>@db.hwypvnfpkozmwnaecrhz.supabase.co:5432/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:<password>@db.hwypvnfpkozmwnaecrhz.supabase.co:5432/postgres?sslmode=require"
```

`web/.env` must already be in `.gitignore` (create-next-app adds this by default — verify with `git check-ignore web/.env`).

- [ ] **Step 4: Generate and apply the migration against the real Supabase database**

```bash
cd web
npx prisma migrate dev --name init
```

This diffs the schema above against the live Supabase database (which currently has the Hibernate-created shape), generates a migration that adds `clerk_user_id` to `users`, drops `password`/`phone_verified`/`email_verified_at` from `users`, and drops `verification_tokens`/`password_reset_tokens`. Review the generated SQL in `web/prisma/migrations/*/migration.sql` before confirming — it must not contain any `DROP TABLE` for `vehicles`, `parts`, `offers`, `orders`, `order_items`, `appointments`, `appointment_services`, `test_drive_requests`, or `contact_requests`.

- [ ] **Step 5: Generate the Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 6: Write `web/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 7: Write the failing test**

`web/tests/lib/prisma.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('prisma client', () => {
  it('exposes the models this app depends on', () => {
    expect(prisma.user).toBeDefined()
    expect(prisma.vehicle).toBeDefined()
    expect(prisma.part).toBeDefined()
    expect(prisma.offer).toBeDefined()
    expect(prisma.order).toBeDefined()
    expect(prisma.orderItem).toBeDefined()
    expect(prisma.appointment).toBeDefined()
    expect(prisma.appointmentService).toBeDefined()
    expect(prisma.testDriveRequest).toBeDefined()
    expect(prisma.contactRequest).toBeDefined()
  })
})
```

- [ ] **Step 8: Run the test, verify it passes**

Run: `cd web && npm test -- tests/lib/prisma.test.ts`
Expected: 1 passed (this only checks the client shape, no live DB connection required)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema and client, migrate Supabase schema"
```

Note: do not commit `web/.env`. Do commit `web/prisma/migrations/`.

---

### Task 4: Clerk integration — provider, sign-in/sign-up pages, middleware

**Files:**
- Create: `web/app/layout.tsx` (replaces Task 1's version, adds `ClerkProvider`)
- Create: `web/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `web/app/sign-up/[[...sign-up]]/page.tsx`
- Create: `web/middleware.ts`
- Test: `web/tests/middleware.test.ts`

**Interfaces:**
- Produces: the route-matcher contract later tasks rely on — any route NOT matched by `isPublicRoute` in `middleware.ts` requires a signed-in Clerk session; any route matched by `isAdminRoute` additionally requires `sessionClaims.metadata.role === 'ADMIN'`.

- [ ] **Step 1: Install Clerk**

```bash
cd web
npm install @clerk/nextjs
```

- [ ] **Step 2: Manual setup (not automatable — do this before continuing)**

1. Create a Clerk application at https://dashboard.clerk.com (or use an existing one for this project).
2. In **User & Authentication → Email, Phone, Username**: enable Email address (required, used as identifier) and Password. Disable Username as an identifier (email is primary per the design spec). Enable Phone number as an optional, non-required field.
3. In **User & Authentication → Multi-factor**: enable "Phone number" as an available second factor.
4. In **SMS/Phone → Configure your own Twilio account** (BYO Twilio): enter the project's Twilio Account SID, Auth Token, and Messaging Service SID.
5. In **Sessions → Edit JWT template** (or **Sessions → Customize session token**): add a custom claim `metadata` set to `{{user.public_metadata}}` so `role` is readable from `sessionClaims.metadata.role` in middleware without an extra API call.
6. In **API Keys**: copy the Publishable key and Secret key into `web/.env` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
7. In **Webhooks**: create an endpoint pointing at `<NEXT_PUBLIC_APP_URL>/api/webhooks/clerk` (this route is built in Task 5) subscribed to `user.created`, `user.updated`, `user.deleted`. Copy the signing secret into `web/.env` as `CLERK_WEBHOOK_SECRET`.

- [ ] **Step 3: Write `web/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suzuki Bike System',
  description: 'Suzuki Motorcycle Nepal — bikes, scooters, parts, and service',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 4: Write `web/app/sign-in/[[...sign-in]]/page.tsx`**

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 'bg-[#E60012] hover:bg-[#C5000F] text-sm normal-case',
            card: 'shadow-lg border border-zinc-200 rounded-2xl',
          },
        }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Write `web/app/sign-up/[[...sign-up]]/page.tsx`**

```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-[#E60012] hover:bg-[#C5000F] text-sm normal-case',
            card: 'shadow-lg border border-zinc-200 rounded-2xl',
          },
        }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Write `web/middleware.ts`**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicGetRoute = createRouteMatcher([
  '/api/vehicles',
  '/api/vehicles/(.*)',
  '/api/parts',
  '/api/parts/(.*)',
  '/api/offers',
  '/api/offers/(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/bikes',
  '/scooters',
  '/products/(.*)',
  '/parts',
  '/parts/(.*)',
  '/offers',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/contact',
  '/api/test-drive',
  '/api/payments/webhook',
  '/api/webhooks/clerk',
])

const isAdminRoute = createRouteMatcher([
  '/admin/(.*)',
  '/api/admin/(.*)',
  '/api/analytics/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  if (isPublicRoute(req)) return NextResponse.next()
  if (req.method === 'GET' && isPublicGetRoute(req)) return NextResponse.next()

  if (!userId) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }
    const signInUrl = new URL('/sign-in', req.url)
    return NextResponse.redirect(signInUrl)
  }

  if (isAdminRoute(req)) {
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
    if (role !== 'ADMIN') {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)', '/(api|trpc)(.*)'],
}
```

- [ ] **Step 7: Write the failing test**

`web/tests/middleware.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { config } from '@/middleware'

describe('middleware config', () => {
  it('matches API routes', () => {
    const apiMatcher = config.matcher[1]
    expect(apiMatcher).toBe('/(api|trpc)(.*)')
  })

  it('excludes static assets from the page matcher', () => {
    const pageMatcher = config.matcher[0]
    expect(pageMatcher).toContain('_next')
    expect(pageMatcher).toContain('css')
  })
})
```

- [ ] **Step 8: Run the test, verify it passes**

Run: `cd web && npm test -- tests/middleware.test.ts`
Expected: 2 passed

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Clerk auth provider, sign-in/up pages, and route middleware"
```

---

### Task 5: Clerk webhook sync + auth helpers

**Files:**
- Create: `web/app/api/webhooks/clerk/route.ts`
- Create: `web/lib/auth.ts`
- Test: `web/tests/api/webhooks/clerk.test.ts`
- Test: `web/tests/lib/auth.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 3), `ApiError`/`handleApiError` (Task 1).
- Produces: `requireUser(): Promise<User>` and `requireAdmin(): Promise<User>` from `lib/auth.ts` — both throw `ApiError` (401/403) on failure, and both are the exact functions every later Route Handler task imports for auth. `User` here is the Prisma `User` model type (`import type { User } from '@prisma/client'`).

- [ ] **Step 1: Install the webhook verification library**

```bash
cd web
npm install svix
```

- [ ] **Step 2: Write `web/app/api/webhooks/clerk/route.ts`**

```typescript
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    username: string | null
    email_addresses: { id: string; email_address: string }[]
    primary_email_address_id: string | null
    phone_numbers: { id: string; phone_number: string }[]
    primary_phone_number_id: string | null
    public_metadata: { role?: string }
  }
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ message: 'Webhook not configured' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ message: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(secret)

  let event: ClerkUserEvent
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  const { data, type } = event

  if (type === 'user.deleted') {
    // Row is kept (Order/Appointment hold references) — nothing to do.
    return NextResponse.json({ ok: true })
  }

  const primaryEmail = data.email_addresses.find((e) => e.id === data.primary_email_address_id)?.email_address
    ?? data.email_addresses[0]?.email_address
  const primaryPhone = data.phone_numbers.find((p) => p.id === data.primary_phone_number_id)?.phone_number
    ?? data.phone_numbers[0]?.phone_number ?? null
  const role: Role = data.public_metadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'
  const username = data.username ?? primaryEmail ?? data.id

  if (!primaryEmail) {
    return NextResponse.json({ message: 'User has no email address' }, { status: 400 })
  }

  await prisma.user.upsert({
    where: { clerkUserId: data.id },
    create: {
      clerkUserId: data.id,
      username,
      email: primaryEmail,
      phoneNumber: primaryPhone,
      role,
    },
    update: {
      username,
      email: primaryEmail,
      phoneNumber: primaryPhone,
      role,
    },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Write the failing test for the webhook**

`web/tests/api/webhooks/clerk.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { upsert: vi.fn() } },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([
    ['svix-id', 'id1'],
    ['svix-timestamp', '123'],
    ['svix-signature', 'sig1'],
  ])),
}))

const verifyMock = vi.fn()
vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({ verify: verifyMock })),
}))

import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/webhooks/clerk/route'

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test'
  })

  it('upserts a local User row on user.created', async () => {
    verifyMock.mockReturnValue({
      type: 'user.created',
      data: {
        id: 'user_123',
        username: 'johndoe',
        email_addresses: [{ id: 'email_1', email_address: 'john@example.com' }],
        primary_email_address_id: 'email_1',
        phone_numbers: [],
        primary_phone_number_id: null,
        public_metadata: {},
      },
    })

    const req = new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body: '{}' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkUserId: 'user_123' },
        create: expect.objectContaining({ email: 'john@example.com', role: 'CLIENT' }),
      })
    )
  })

  it('maps publicMetadata.role ADMIN through to the mirrored row', async () => {
    verifyMock.mockReturnValue({
      type: 'user.updated',
      data: {
        id: 'user_123',
        username: 'johndoe',
        email_addresses: [{ id: 'email_1', email_address: 'john@example.com' }],
        primary_email_address_id: 'email_1',
        phone_numbers: [],
        primary_phone_number_id: null,
        public_metadata: { role: 'ADMIN' },
      },
    })

    const req = new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body: '{}' })
    await POST(req)

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ role: 'ADMIN' }) })
    )
  })

  it('rejects an invalid signature', async () => {
    verifyMock.mockImplementation(() => {
      throw new Error('bad signature')
    })

    const req = new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body: '{}' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 4: Run the test, verify it fails**

Run: `cd web && npm test -- tests/api/webhooks/clerk.test.ts`
Expected: FAIL (route file doesn't exist yet if run before Step 2 — if run after Step 2, this should already pass; run it now to confirm Step 2's implementation is correct)

- [ ] **Step 5: Run the test again after Step 2's implementation, verify it passes**

Run: `cd web && npm test -- tests/api/webhooks/clerk.test.ts`
Expected: 3 passed

- [ ] **Step 6: Write `web/lib/auth.ts`**

```typescript
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import type { User, Role } from '@prisma/client'

export async function requireUser(): Promise<User> {
  const { userId } = await auth()
  if (!userId) throw new ApiError(401, 'Not authenticated')

  let user = await prisma.user.findUnique({ where: { clerkUserId: userId } })

  if (!user) {
    // Fallback sync in case the Clerk webhook hasn't landed yet.
    const clerkUser = await currentUser()
    if (!clerkUser) throw new ApiError(401, 'Not authenticated')

    const email = clerkUser.primaryEmailAddress?.emailAddress
    if (!email) throw new ApiError(400, 'User has no email address')

    const role: Role = clerkUser.publicMetadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'

    user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        username: clerkUser.username ?? email,
        email,
        phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
        role,
      },
      update: {},
    })
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new ApiError(403, 'Admin access required')
  return user
}
```

- [ ] **Step 7: Write the failing test**

`web/tests/lib/auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const authMock = vi.fn()
const currentUserMock = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => authMock(),
  currentUser: () => currentUserMock(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), upsert: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth'
import { ApiError } from '@/lib/api-error'

describe('requireUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when there is no Clerk session', async () => {
    authMock.mockResolvedValue({ userId: null })
    await expect(requireUser()).rejects.toMatchObject({ status: 401 })
  })

  it('returns the mirrored local User row when it exists', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clerkUserId: 'user_1', role: 'CLIENT', email: 'a@b.com', username: 'a',
    })

    const user = await requireUser()
    expect(user.id).toBe(1)
  })

  it('lazily creates the local User row if the webhook has not landed yet', async () => {
    authMock.mockResolvedValue({ userId: 'user_2' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    currentUserMock.mockResolvedValue({
      username: 'newbie',
      primaryEmailAddress: { emailAddress: 'newbie@example.com' },
      primaryPhoneNumber: null,
      publicMetadata: {},
    })
    ;(prisma.user.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2, clerkUserId: 'user_2', role: 'CLIENT', email: 'newbie@example.com', username: 'newbie',
    })

    const user = await requireUser()
    expect(user.email).toBe('newbie@example.com')
    expect(prisma.user.upsert).toHaveBeenCalled()
  })
})

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 403 for a non-admin user', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clerkUserId: 'user_1', role: 'CLIENT', email: 'a@b.com', username: 'a',
    })

    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 })
  })

  it('returns the user when role is ADMIN', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clerkUserId: 'user_1', role: 'ADMIN', email: 'a@b.com', username: 'a',
    })

    const user = await requireAdmin()
    expect(user.role).toBe('ADMIN')
  })
})
```

- [ ] **Step 8: Run tests, verify pass**

Run: `cd web && npm test -- tests/lib/auth.test.ts`
Expected: 5 passed

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: sync Clerk users to local DB via webhook, add requireUser/requireAdmin"
```

---

### Task 6: Shared layout — Navbar, Footer, LoadingSpinner, HeroSection, site layout

**Files:**
- Create: `web/components/Navbar.tsx`
- Create: `web/components/Footer.tsx`
- Create: `web/components/LoadingSpinner.tsx`
- Create: `web/components/HeroSection.tsx`
- Create: `web/app/(site)/layout.tsx`
- Test: `web/tests/components/Navbar.test.tsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Input`, `DropdownMenu*` (Task 2), `cn` (Task 1).
- Produces: `<Navbar />`, `<Footer />`, `<LoadingSpinner className? label? />`, `<HeroSection />` — imported by name in every page task from Task 8 onward. All pages render inside `web/app/(site)/layout.tsx`, which wraps children with `<Navbar />` + `<main>{children}</main>` + `<Footer />` is NOT included in the shared layout (each page renders its own `<Footer />` at the end, matching the current app's per-page `<Footer />` placement) — the shared layout only provides `<Navbar />` and the `<main>` wrapper.

- [ ] **Step 1: Write `web/components/LoadingSpinner.tsx`**

```typescript
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoadingSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className="w-10 h-10 text-[#E60012] animate-spin" aria-hidden />
      {label && <p className="text-sm text-zinc-500">{label}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Write `web/components/Footer.tsx`**

```typescript
import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-zinc-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/bikes" className="text-zinc-300 hover:text-white transition-colors">Bikes</Link></li>
              <li><Link href="/parts" className="text-zinc-300 hover:text-white transition-colors">Parts</Link></li>
              <li><Link href="/offers" className="text-zinc-300 hover:text-white transition-colors">Offers</Link></li>
              <li><Link href="/test-drive" className="text-zinc-300 hover:text-white transition-colors">Book Test Drive</Link></li>
              <li><Link href="/contact" className="text-zinc-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#E60012] shrink-0 mt-0.5" />
                <div><p className="text-zinc-300">Phone</p><p className="text-white">+977-1-XXXXXXX</p></div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#E60012] shrink-0 mt-0.5" />
                <div><p className="text-zinc-300">Email</p><p className="text-white">info@suzukimotorcycle.com.np</p></div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#E60012] shrink-0 mt-0.5" />
                <div><p className="text-zinc-300">Address</p><p className="text-white">Balkumari, Lalitpur, Nepal</p></div>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">About Suzuki</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Suzuki is the oldest and most renowned biking brand in the world. We offer reliable,
              technologically sound, and trustworthy motorcycles and scooters in Nepal.
            </p>
          </div>
        </div>
        <div className="border-t border-zinc-800 mt-8 pt-8 text-center">
          <p className="text-zinc-400 text-sm">© {new Date().getFullYear()} Suzuki Motorcycle Nepal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Write `web/components/Navbar.tsx`**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { Menu, X, User as UserIcon, LogOut, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/bikes', label: 'Bikes' },
  { href: '/scooters', label: 'Scooters' },
  { href: '/parts', label: 'Parts' },
  { href: '/offers', label: 'Offers' },
  { href: '/test-drive', label: 'Test Drive' },
  { href: '/contact', label: 'Contact' },
  { href: '/book-service', label: 'Book Service', highlight: true },
]

export default function Navbar() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const role = (user?.publicMetadata?.role as string | undefined) ?? 'CLIENT'

  const handleLogout = () => signOut({ redirectUrl: '/' })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/bikes?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="h-10 rounded-xl bg-[#E60012] flex items-center justify-center px-4 text-white font-bold">
              Suzuki
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-2xl mx-6">
            {navItems.map(({ href, label, highlight }) => (
              <Link
                key={href}
                href={href}
                className={
                  highlight
                    ? 'px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-[#E60012] text-white hover:bg-[#C5000F]'
                    : 'px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap text-zinc-700 hover:bg-zinc-100'
                }
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-40 lg:w-48 rounded-xl"
                />
              </div>
            </form>

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#E60012] flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:inline font-medium">{user?.username ?? user?.primaryEmailAddress?.emailAddress}</span>
                    <Badge variant="secondary" className="hidden sm:inline-flex text-xs">{role}</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/my-orders">My Orders</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/my-appointments">My Appointments</Link></DropdownMenuItem>
                  {role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild><Link href="/bikes">Manage Bikes</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/parts">Manage Parts</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/users">Admin Users</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/orders">Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/analytics">Analytics</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/appointments">Appointments</Link></DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white rounded-xl">
                  <Link href="/sign-in">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#E60012] hover:bg-[#C5000F] text-white rounded-xl">
                  <Link href="/sign-up">Register</Link>
                </Button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-zinc-200 flex flex-col gap-1">
            {navItems.map(({ href, label, highlight }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  highlight
                    ? 'px-4 py-3 rounded-xl font-medium bg-[#E60012] text-white'
                    : 'px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100'
                }
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Write `web/components/HeroSection.tsx`**

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Calendar, Tag } from 'lucide-react'

export default function HeroSection() {
  return (
    <section
      className="relative w-full py-28 px-4 sm:px-6 lg:px-8 text-white min-h-[520px] flex items-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/assets/images/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">Ride the Next Generation</h1>
        <p className="text-xl sm:text-2xl text-zinc-200 max-w-2xl mx-auto mb-12">
          Explore Suzuki Motorcycles & Scooters. Updated stock, best parts, and offers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button asChild size="lg" className="bg-[#E60012] hover:bg-[#C5000F] text-white font-semibold px-8 py-6 rounded-xl">
            <Link href="/contact"><MessageSquare className="w-5 h-5 mr-2" />Enquiry</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-zinc-900 font-semibold px-8 py-6 rounded-xl">
            <Link href="/test-drive"><Calendar className="w-5 h-5 mr-2" />Book Test Drive</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-zinc-900 font-semibold px-8 py-6 rounded-xl">
            <Link href="/offers"><Tag className="w-5 h-5 mr-2" />View Offers</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Write `web/app/(site)/layout.tsx`**

```typescript
import Navbar from '@/components/Navbar'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
```

- [ ] **Step 6: Write the failing test**

`web/tests/components/Navbar.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Navbar', () => {
  it('shows Login/Register when signed out', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument()
  })

  it('renders the primary nav links', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Bikes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book Service' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Run tests, verify pass**

Run: `cd web && npm test -- tests/components/Navbar.test.tsx`
Expected: 2 passed

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: port Navbar, Footer, LoadingSpinner, HeroSection, site layout"
```

---

### Task 7: Vehicles API

**Files:**
- Create: `web/lib/validations/vehicle.ts`
- Create: `web/app/api/vehicles/route.ts`
- Create: `web/app/api/vehicles/[id]/route.ts`
- Test: `web/tests/api/vehicles.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 3), `requireAdmin` (Task 5), `ApiError`/`handleApiError` (Task 1).
- Produces: `vehicleInputSchema: ZodSchema`, `vehicleTypeEnum: ZodEnum<['BIKE', 'SCOOTER']>` from `lib/validations/vehicle.ts` — reused by the admin vehicles page (Task 8) for client-side form validation. Route contract: `GET /api/vehicles?q=&type=` (public), `GET /api/vehicles/:id` (public), `POST /api/vehicles` (admin), `PUT /api/vehicles/:id` (admin), `DELETE /api/vehicles/:id` (admin) → 204.

- [ ] **Step 1: Write `web/lib/validations/vehicle.ts`**

```typescript
import { z } from 'zod'

export const vehicleTypeEnum = z.enum(['BIKE', 'SCOOTER'])

export const vehicleInputSchema = z.object({
  type: vehicleTypeEnum,
  modelName: z.string().min(1, 'Model name is required').max(100),
  year: z.number().int().min(1900).max(2100),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  imageUrl: z.string().max(500).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
})

export type VehicleInput = z.infer<typeof vehicleInputSchema>
```

- [ ] **Step 2: Write the failing test**

`web/tests/api/vehicles.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    vehicle: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/vehicles/route'
import { GET as GET_ONE, PUT, DELETE } from '@/app/api/vehicles/[id]/route'

describe('GET /api/vehicles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists Suzuki vehicles filtered by type', async () => {
    ;(prisma.vehicle.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, type: 'BIKE' }])
    const req = new Request('http://localhost/api/vehicles?type=BIKE')
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ brand: 'Suzuki', type: 'BIKE' }) })
    )
  })
})

describe('POST /api/vehicles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue({ status: 403, message: 'Admin access required' })
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ type: 'BIKE', modelName: 'Gixxer', year: 2024, price: 100, quantity: 1 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('creates a vehicle for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.vehicle.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5, modelName: 'Gixxer' })
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ type: 'BIKE', modelName: 'Gixxer', year: 2024, price: 100, quantity: 1 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
  })
})

describe('GET /api/vehicles/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 for a missing vehicle', async () => {
    ;(prisma.vehicle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const req = new Request('http://localhost/api/vehicles/999')
    const res = await GET_ONE(req as never, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/vehicles/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on successful admin delete', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.vehicle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    ;(prisma.vehicle.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    const req = new Request('http://localhost/api/vehicles/5', { method: 'DELETE' })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: '5' }) })
    expect(res.status).toBe(204)
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/vehicles.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 4: Write `web/app/api/vehicles/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { vehicleInputSchema, vehicleTypeEnum } from '@/lib/validations/vehicle'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const typeParam = searchParams.get('type')
    const type = typeParam ? vehicleTypeEnum.parse(typeParam) : undefined

    const vehicles = await prisma.vehicle.findMany({
      where: {
        brand: 'Suzuki',
        ...(type ? { type } : {}),
        ...(q ? { modelName: { contains: q, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(vehicles)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = vehicleInputSchema.parse(body)
    const vehicle = await prisma.vehicle.create({ data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 5: Write `web/app/api/vehicles/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { vehicleInputSchema } from '@/lib/validations/vehicle'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!vehicle) throw new ApiError(404, 'Vehicle not found')
    return NextResponse.json(vehicle)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = vehicleInputSchema.parse(body)
    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Vehicle not found')
    const vehicle = await prisma.vehicle.update({ where: { id: Number(id) }, data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(vehicle)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Vehicle not found')
    await prisma.vehicle.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/vehicles.test.ts`
Expected: 5 passed

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add vehicles API route handlers"
```

---

### Task 8: Shared catalog & admin UI components

**Files:**
- Create: `web/components/ProductCard.tsx`
- Create: `web/components/PartCard.tsx`
- Create: `web/components/CategoryTabs.tsx`
- Create: `web/components/AdminCardActions.tsx`
- Create: `web/components/ConfirmDeleteDialog.tsx`
- Create: `web/components/AddEditModal.tsx`
- Create: `web/components/DataTable.tsx`
- Create: `web/components/SkeletonGrid.tsx`
- Create: `web/components/StatsRow.tsx`
- Test: `web/tests/components/AdminCardActions.test.tsx`
- Test: `web/tests/components/ConfirmDeleteDialog.test.tsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Skeleton`, `Table*`, `Tabs*`, `Dialog*` (Task 2), `cn` (Task 1), `formatNPR` (Task 1), `getImageUrl`/`PLACEHOLDER_IMAGE` (Task 1), `vehicleDescription`/`partDescription`/`vehicleTypeLabel`/`partCategoryLabel` (Task 1).
- Produces (exact props every later page task uses):
  - `<ProductCard vehicle={...} serialNumber? onEdit? onDelete? />`
  - `<PartCard part={...} serialNumber? onEdit? onDelete? onAddToCart? />` (cart wiring lives in Task 13; `PartCard` itself only accepts an optional `onAddToCart: (part: Part) => void` and has no direct dependency on the cart context — the caller decides what "add to cart" does, including any sign-in redirect)
  - `<VehicleCategoryTabs value onValueChange />`, `<PartCategoryTabs value onValueChange />`
  - `<AdminCardActions onEdit? onDelete? />`
  - `<ConfirmDeleteDialog open onOpenChange title? message? itemName? onConfirm loading? />`
  - `<AddEditModal open onOpenChange title onSubmit loading? submitLabel? >{children}</AddEditModal>`
  - `<DataTable columns data loading emptyMessage? showActions? onEdit? onDelete? isAdmin? onAddToCart? showAddToCart? />` and `<QuantityBadge value />`
  - `<SkeletonGrid cols? rows? />`
  - `<StatsRow stats loading? />`

- [ ] **Step 1: Write `web/components/AdminCardActions.tsx`**

```typescript
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface AdminCardActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export default function AdminCardActions({ onEdit, onDelete, className = '' }: AdminCardActionsProps) {
  if (!onEdit && !onDelete) return null

  return (
    <div className={`flex gap-2 ${className}`}>
      {onEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl border-zinc-300 hover:border-[#E60012] hover:text-[#E60012]"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit() }}
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete() }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the failing test for AdminCardActions**

`web/tests/components/AdminCardActions.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminCardActions from '@/components/AdminCardActions'

describe('AdminCardActions', () => {
  it('renders nothing when neither handler is provided', () => {
    const { container } = render(<AdminCardActions />)
    expect(container).toBeEmptyDOMElement()
  })

  it('calls onEdit and onDelete when their buttons are clicked', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<AdminCardActions onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: Run test, verify pass**

Run: `cd web && npm test -- tests/components/AdminCardActions.test.tsx`
Expected: 2 passed

- [ ] **Step 4: Write `web/components/ConfirmDeleteDialog.tsx`**

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message?: string
  onConfirm: () => void
  loading?: boolean
  itemName?: string
}

export default function ConfirmDeleteDialog({
  open, onOpenChange, title = 'Confirm Delete', message, onConfirm, loading = false, itemName,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-zinc-600">
          {message || `This action cannot be undone. Are you sure you want to delete "${itemName}"?`}
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Write the failing test for ConfirmDeleteDialog**

`web/tests/components/ConfirmDeleteDialog.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'

describe('ConfirmDeleteDialog', () => {
  it('shows the item name in the default message', () => {
    render(<ConfirmDeleteDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} itemName="Gixxer 155" />)
    expect(screen.getByText(/Gixxer 155/)).toBeInTheDocument()
  })

  it('calls onConfirm when Delete is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDeleteDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} itemName="Gixxer 155" />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 6: Run test, verify pass**

Run: `cd web && npm test -- tests/components/ConfirmDeleteDialog.test.tsx`
Expected: 2 passed

- [ ] **Step 7: Write `web/components/AddEditModal.tsx`**

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AddEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  loading?: boolean
  submitLabel?: string
}

export default function AddEditModal({
  open, onOpenChange, title, onSubmit, children, loading, submitLabel = 'Save',
}: AddEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#E60012] hover:bg-[#C5000F]">
              {loading ? 'Saving...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 8: Write `web/components/CategoryTabs.tsx`**

```typescript
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const vehicleTabs = [
  { value: 'BIKE', label: 'Suzuki Motorcycles' },
  { value: 'SCOOTER', label: 'Suzuki Scooters' },
]

const partTabs = [
  { value: 'BIKE_PART', label: 'Suzuki Bike Parts' },
  { value: 'SCOOTER_PART', label: 'Suzuki Scooter Parts' },
]

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
}

export function VehicleCategoryTabs({ value, onValueChange }: TabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="bg-zinc-100 p-1 rounded-xl w-full sm:w-auto">
        {vehicleTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg data-[state=active]:bg-[#E60012] data-[state=active]:text-white">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export function PartCategoryTabs({ value, onValueChange }: TabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="bg-zinc-100 p-1 rounded-xl w-full sm:w-auto">
        {partTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg data-[state=active]:bg-[#E60012] data-[state=active]:text-white">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
```

- [ ] **Step 9: Write `web/components/ProductCard.tsx`**

```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AdminCardActions from '@/components/AdminCardActions'
import { formatNPR } from '@/lib/currency'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/lib/images'
import { vehicleDescription, vehicleTypeLabel } from '@/lib/catalogDescriptions'
import type { Vehicle } from '@prisma/client'

interface ProductCardProps {
  vehicle: Vehicle
  serialNumber?: number
  onEdit?: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
}

export default function ProductCard({ vehicle, serialNumber, onEdit, onDelete }: ProductCardProps) {
  const isLowStock = (vehicle.quantity ?? 0) <= 5
  const imgSrc = getImageUrl(vehicle)
  const isAdminCard = Boolean(onEdit || onDelete)

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-md hover:shadow-xl hover:border-[#E60012]/30 hover:-translate-y-1 transition-all duration-300">
      {serialNumber != null && (
        <span className="absolute top-3 right-3 z-20 min-w-[2rem] text-center bg-[#E60012] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
          #{serialNumber}
        </span>
      )}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={vehicle.modelName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
        />
        {isLowStock && <Badge variant="destructive" className="absolute bottom-3 left-3 z-10 shadow">Low Stock</Badge>}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className="bg-[#E60012]/10 text-[#E60012] border-0">{vehicleTypeLabel(vehicle.type)}</Badge>
          <Badge variant="secondary" className="text-xs shrink-0">Stock: {vehicle.quantity ?? 0}</Badge>
        </div>
        <h3 className="font-bold text-lg text-zinc-900 leading-tight mt-0.5 mb-1">{vehicle.modelName}</h3>
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{vehicleDescription(vehicle)}</p>
        <p className="font-bold text-xl text-[#E60012] mb-3">{formatNPR(vehicle.price)}</p>
        {isAdminCard ? (
          <div className="space-y-2 mt-auto">
            <AdminCardActions onEdit={onEdit ? () => onEdit(vehicle) : undefined} onDelete={onDelete ? () => onDelete(vehicle) : undefined} />
            <Button asChild size="sm" variant="ghost" className="w-full rounded-xl text-zinc-600">
              <Link href={`/products/${vehicle.id}`}>View details</Link>
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" className="w-full mt-auto bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
            <Link href={`/products/${vehicle.id}`}>View Details</Link>
          </Button>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 10: Write `web/components/PartCard.tsx`**

```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AdminCardActions from '@/components/AdminCardActions'
import { Eye, ShoppingCart } from 'lucide-react'
import { formatNPR } from '@/lib/currency'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/lib/images'
import { partDescription, partCategoryLabel } from '@/lib/catalogDescriptions'
import type { Part } from '@prisma/client'

interface PartCardProps {
  part: Part
  serialNumber?: number
  onEdit?: (part: Part) => void
  onDelete?: (part: Part) => void
  onAddToCart?: (part: Part) => void
}

export default function PartCard({ part, serialNumber, onEdit, onDelete, onAddToCart }: PartCardProps) {
  const isLowStock = (part.quantity ?? 0) <= 5
  const imgSrc = getImageUrl(part)
  const isAdminCard = Boolean(onEdit || onDelete)

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-md hover:shadow-xl hover:border-[#E60012]/30 hover:-translate-y-1 transition-all duration-300">
      {serialNumber != null && (
        <span className="absolute top-3 right-3 z-20 min-w-[2rem] text-center bg-[#E60012] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
          #{serialNumber}
        </span>
      )}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={part.partName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
        />
        {isLowStock && <Badge variant="destructive" className="absolute bottom-3 left-3 z-10 shadow">Low Stock</Badge>}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <Badge className="w-fit mb-2 bg-zinc-100 text-zinc-700 border-0">{partCategoryLabel(part.type)}</Badge>
        <h3 className="font-bold text-lg text-zinc-900 leading-tight mb-1">{part.partName}</h3>
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{partDescription(part)}</p>
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="font-bold text-xl text-[#E60012]">{formatNPR(part.price)}</p>
          <Badge variant={isLowStock ? 'destructive' : 'secondary'} className="text-xs">Qty: {part.quantity ?? 0}</Badge>
        </div>
        {isAdminCard ? (
          <div className="space-y-2 mt-auto">
            <AdminCardActions onEdit={onEdit ? () => onEdit(part) : undefined} onDelete={onDelete ? () => onDelete(part) : undefined} />
            <Button asChild size="sm" variant="ghost" className="w-full rounded-xl text-zinc-600">
              <Link href={`/parts/${part.id}`}>View details</Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 mt-auto pt-3 border-t border-zinc-100">
            <Button asChild size="sm" className="flex-1 bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
              <Link href={`/parts/${part.id}`}><Eye className="w-4 h-4 mr-1" />View</Link>
            </Button>
            {onAddToCart && (
              <Button
                size="sm"
                variant="outline"
                className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white rounded-xl"
                onClick={() => onAddToCart(part)}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 11: Write `web/components/DataTable.tsx`**

```typescript
'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const LOW_STOCK = 5

export function QuantityBadge({ value }: { value: number | null | undefined }) {
  const isLow = (value ?? 0) <= LOW_STOCK
  return (
    <span className="inline-flex items-center gap-2">
      {value ?? 0}
      {isLow && <Badge variant="destructive" className="text-xs">Low</Badge>}
    </span>
  )
}

interface Column<T> {
  key: string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
}

interface DataTableProps<T extends { id: number }> {
  columns: Column<T>[]
  data: T[]
  loading: boolean
  emptyMessage?: string
  showActions?: boolean
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  isAdmin?: boolean
  onAddToCart?: (row: T) => void
  showAddToCart?: boolean
}

export default function DataTable<T extends { id: number } & Record<string, unknown>>({
  columns, data, loading, emptyMessage = 'No data found.', showActions = true,
  onEdit, onDelete, isAdmin = false, onAddToCart, showAddToCart = false,
}: DataTableProps<T>) {
  const hasActions = (showActions && isAdmin) || showAddToCart

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}
              {hasActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {columns.map((col) => <TableCell key={col.key}><Skeleton className="h-4 w-20" /></TableCell>)}
                {hasActions && <TableCell><Skeleton className="h-8 w-16" /></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
        <p className="text-zinc-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}
            {hasActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((col) => {
                const value = row[col.key]
                return <TableCell key={col.key}>{col.render ? col.render(value, row) : String(value ?? '')}</TableCell>
              })}
              {hasActions && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {showAddToCart && !isAdmin && onAddToCart && (
                      <Button variant="default" size="sm" onClick={() => onAddToCart(row)}>Add to Cart</Button>
                    )}
                    {showActions && isAdmin && onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(row)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
                    )}
                    {showActions && isAdmin && onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Delete"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 12: Write `web/components/SkeletonGrid.tsx` and `web/components/StatsRow.tsx`**

`web/components/SkeletonGrid.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function SkeletonGrid({ cols = 4, rows = 1 }: { cols?: number; rows?: number }) {
  const count = cols * rows
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

`web/components/StatsRow.tsx`:

```typescript
import { Bike, Package, AlertTriangle, ShoppingBag } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const stats = [
  { key: 'totalVehicles', label: 'Total Vehicles', icon: Bike, color: 'text-blue-600' },
  { key: 'totalParts', label: 'Total Parts', icon: Package, color: 'text-green-600' },
  { key: 'lowStock', label: 'Low Stock', icon: AlertTriangle, color: 'text-amber-600' },
  { key: 'ordersToday', label: 'Orders Today', icon: ShoppingBag, color: 'text-purple-600' },
]

export default function StatsRow({ stats: statsData = {}, loading = false }: { stats?: Record<string, number>; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.key} className="bg-white rounded-2xl border border-zinc-200 p-6">
            <Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-zinc-600 mb-1">{label}</p><p className="text-2xl font-bold text-zinc-900">{statsData[key] || 0}</p></div>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add shared catalog and admin UI components"
```

---

### Task 9: Vehicle pages (public + admin)

**Files:**
- Create: `web/components/VehicleCatalogPage.tsx`
- Create: `web/app/(site)/bikes/page.tsx`
- Create: `web/app/(site)/scooters/page.tsx`
- Create: `web/app/(site)/products/[id]/page.tsx`
- Create: `web/app/(site)/page.tsx` (home page, replaces Task 1's placeholder)
- Test: `web/tests/components/VehicleCatalogPage.test.tsx`
- Test: `web/tests/app/products-detail.test.tsx`

**Interfaces:**
- Consumes: `ProductCard`, `AddEditModal`, `ConfirmDeleteDialog`, `SkeletonGrid`, `LoadingSpinner`, `Footer`, `HeroSection` (Tasks 6/8), `Input`, `Button`, `Label` (Task 2), `vehicleInputSchema` (Task 7), `formatNPR` (Task 1), `getImageUrl` (Task 1). Fetches `GET/POST/PUT/DELETE /api/vehicles(/:id)` (Task 7) via `fetch`.
- Produces: `<VehicleCatalogPage type="BIKE" | "SCOOTER" heading={string} addLabel={string} />`. Pages: `/bikes`, `/scooters`, `/products/:id`, `/` (home).

**Design note:** `/bikes` and `/scooters` are thin route wrappers around one shared `VehicleCatalogPage` component parameterized by `type`/`heading`/`addLabel` — same pattern the original app used (`BikesPage`/`ScootersPage` as one-line wrappers around a shared `ProductsPage`), and the same pattern Task 11 uses for parts. Do not duplicate the catalog logic into two page files.

- [ ] **Step 1: Write `web/components/VehicleCatalogPage.tsx`**

This Client Component fetches vehicles client-side (matches the existing app's admin-CRUD-in-place-on-the-catalog-page pattern) and supports both the public browsing view and the admin add/edit/delete flow on the same page. It is parameterized by `type` so `/bikes` and `/scooters` can both render it.

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search } from 'lucide-react'
import type { Vehicle } from '@prisma/client'

interface VehicleFormState {
  type: 'BIKE' | 'SCOOTER'
  modelName: string
  year: number
  price: number
  quantity: number
  imageUrl: string
  description: string
}

interface VehicleCatalogPageProps {
  type: 'BIKE' | 'SCOOTER'
  heading: string
  addLabel: string
}

export default function VehicleCatalogPage({ type, heading, addLabel }: VehicleCatalogPageProps) {
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'

  const emptyForm: VehicleFormState = { type, modelName: '', year: new Date().getFullYear(), price: 0, quantity: 0, imageUrl: '', description: '' }

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<VehicleFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({ type })
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    const res = await fetch(`/api/vehicles?${params}`)
    setVehicles(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [type])

  const displayList = useMemo(() => [...vehicles].sort((a, b) => a.id - b.id), [vehicles])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (v: Vehicle) => {
    setEditing(v)
    setForm({ type: v.type, modelName: v.modelName, year: v.year, price: v.price, quantity: v.quantity, imageUrl: v.imageUrl ?? '', description: v.description ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, imageUrl: form.imageUrl || undefined, description: form.description || undefined }
    const url = editing ? `/api/vehicles/${editing.id}` : '/api/vehicles'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setModalOpen(false); await fetchData() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/vehicles/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setDeleteTarget(null); await fetchData() }
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{heading}</h1>
              <p className="text-zinc-600 text-sm mt-1">{displayList.length} vehicle(s)</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> {addLabel}
              </Button>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); fetchData() }}
            className="mb-8 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Button type="submit" variant="outline" className="rounded-xl shrink-0">Search</Button>
          </form>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading vehicles..." />
          ) : displayList.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-600 text-lg font-medium">No vehicles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayList.map((v, i) => (
                <ProductCard
                  key={v.id}
                  serialNumber={i + 1}
                  vehicle={v}
                  onEdit={isAdmin ? openEdit : undefined}
                  onDelete={isAdmin ? (vehicle) => setDeleteTarget(vehicle) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Vehicle' : addLabel} onSubmit={onSubmit} loading={saving} submitLabel={editing ? 'Update' : 'Add'}>
        <div><Label>Model Name *</Label><Input value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })} className="mt-1" required /></div>
        <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Price (Rs)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Stock quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/assets/images/bikes/bike-1.jpg" className="mt-1" /></div>
        <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y min-h-[80px]" /></div>
      </AddEditModal>

      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Vehicle" itemName={deleteTarget?.modelName} onConfirm={handleDelete} loading={deleting} />

      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Write the failing test**

`web/tests/components/VehicleCatalogPage.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VehicleCatalogPage from '@/components/VehicleCatalogPage'

vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: null }) }))

describe('VehicleCatalogPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (url.includes('type=SCOOTER') ? [{ id: 2, type: 'SCOOTER', modelName: 'Access 125', quantity: 5 }] : [{ id: 1, type: 'BIKE', modelName: 'Gixxer 155', quantity: 5 }]),
    })) as unknown as typeof fetch
  })

  it('requests vehicles filtered by the given type and renders the heading', async () => {
    render(<VehicleCatalogPage type="SCOOTER" heading="Suzuki Scooters" addLabel="Add Scooter" />)
    await waitFor(() => expect(screen.getByText('Access 125')).toBeInTheDocument())
    expect(screen.getByText('Suzuki Scooters')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('type=SCOOTER'))
  })
})
```

- [ ] **Step 3: Run test, verify pass**

Run: `cd web && npm test -- tests/components/VehicleCatalogPage.test.tsx`
Expected: 1 passed

- [ ] **Step 4: Write `web/app/(site)/bikes/page.tsx`**

```typescript
import VehicleCatalogPage from '@/components/VehicleCatalogPage'

export default function BikesPage() {
  return <VehicleCatalogPage type="BIKE" heading="Suzuki Motorcycles" addLabel="Add Bike" />
}
```

- [ ] **Step 5: Write `web/app/(site)/scooters/page.tsx`**

```typescript
import VehicleCatalogPage from '@/components/VehicleCatalogPage'

export default function ScootersPage() {
  return <VehicleCatalogPage type="SCOOTER" heading="Suzuki Scooters" addLabel="Add Scooter" />
}
```

- [ ] **Step 6: Write `web/app/(site)/products/[id]/page.tsx`**

```typescript
'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatNPR } from '@/lib/currency'
import { getImageUrl } from '@/lib/images'
import { vehicleDescription, vehicleTypeLabel } from '@/lib/catalogDescriptions'
import type { Vehicle } from '@prisma/client'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setVehicle)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner className="min-h-[60vh]" label="Loading..." />
  if (!vehicle) return <div className="py-24 text-center text-zinc-500">Vehicle not found.</div>

  const typeLabel = vehicleTypeLabel(vehicle.type)
  const isLowStock = (vehicle.quantity ?? 0) <= 5

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button variant="ghost" onClick={() => router.back()} className="text-zinc-500 -ml-2 mb-4">← Back</Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl overflow-hidden flex items-center justify-center p-6 min-h-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getImageUrl(vehicle)} alt={vehicle.modelName} className="w-full max-h-[380px] object-contain drop-shadow-xl" />
          </div>
          <div>
            <Badge className="mb-3 bg-[#E60012]/10 text-[#E60012] border-0 text-xs uppercase">Suzuki {typeLabel}</Badge>
            <h1 className="text-4xl font-bold text-zinc-900 mb-1">{vehicle.modelName}</h1>
            <p className="text-zinc-400 text-sm mb-5">Suzuki{vehicle.year ? ` · ${vehicle.year}` : ''}</p>
            <p className="text-4xl font-extrabold text-[#E60012] mb-6">{formatNPR(vehicle.price)}</p>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full mb-6 ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {isLowStock ? `Only ${vehicle.quantity} left` : `${vehicle.quantity} in stock`}
            </span>
            <p className="text-zinc-600 mb-8">{vehicleDescription(vehicle)}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl px-6"><Link href="/test-drive">Book Test Drive</Link></Button>
              <Button asChild variant="outline" className="rounded-xl px-6"><Link href="/contact">Enquire Now</Link></Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 7: Write `web/app/(site)/page.tsx`** (home page)

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import HeroSection from '@/components/HeroSection'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import SkeletonGrid from '@/components/SkeletonGrid'
import type { Vehicle } from '@prisma/client'

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vehicles?type=BIKE')
      .then((res) => (res.ok ? res.json() : []))
      .then(setVehicles)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <HeroSection />
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-zinc-900">New Arrivals</h2>
            <Button asChild variant="outline" className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white">
              <Link href="/bikes">View All →</Link>
            </Button>
          </div>
          {loading ? (
            <SkeletonGrid rows={1} cols={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vehicles.slice(0, 8).map((v) => <ProductCard key={v.id} vehicle={v} />)}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
```

- [ ] **Step 8: Write the failing test**

`web/tests/app/products-detail.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProductDetailPage from '@/app/(site)/products/[id]/page'

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ back: vi.fn() }),
}))

describe('ProductDetailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 1, type: 'BIKE', modelName: 'Gixxer 155', brand: 'Suzuki', year: 2024, price: 229000, quantity: 10, imageUrl: null, description: null }),
    })) as unknown as typeof fetch
  })

  it('renders the fetched vehicle', async () => {
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText('Gixxer 155')).toBeInTheDocument())
    expect(screen.getByText(/229,000/)).toBeInTheDocument()
  })

  it('shows a "not found" message when the fetch returns 404', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, json: async () => null })
    render(<ProductDetailPage />)
    await waitFor(() => expect(screen.getByText('Vehicle not found.')).toBeInTheDocument())
  })
})
```

- [ ] **Step 9: Run test, verify pass**

Run: `cd web && npm test -- tests/app/products-detail.test.tsx`
Expected: 2 passed

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add bikes/scooters/product-detail pages and home page"
```

---

### Task 10: Parts API

**Files:**
- Create: `web/lib/validations/part.ts`
- Create: `web/app/api/parts/route.ts`
- Create: `web/app/api/parts/[id]/route.ts`
- Test: `web/tests/api/parts.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireAdmin`, `ApiError`/`handleApiError` (same as Task 7).
- Produces: `partInputSchema`, `partTypeEnum` from `lib/validations/part.ts`. Route contract identical in shape to vehicles: `GET /api/parts?q=&type=` (public), `GET /api/parts/:id` (public), `POST /api/parts` (admin), `PUT /api/parts/:id` (admin), `DELETE /api/parts/:id` (admin) → 204.

- [ ] **Step 1: Write `web/lib/validations/part.ts`**

```typescript
import { z } from 'zod'

export const partTypeEnum = z.enum(['BIKE_PART', 'SCOOTER_PART'])

export const partInputSchema = z.object({
  type: partTypeEnum,
  partName: z.string().min(1, 'Part name is required').max(100),
  compatibleModel: z.string().max(100).optional().nullable(),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  imageUrl: z.string().max(500).optional().nullable(),
})

export type PartInput = z.infer<typeof partInputSchema>
```

- [ ] **Step 2: Write the failing test**

`web/tests/api/parts.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { part: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/parts/route'
import { DELETE } from '@/app/api/parts/[id]/route'

describe('GET /api/parts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists Suzuki parts filtered by type', async () => {
    ;(prisma.part.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, type: 'BIKE_PART' }])
    const req = new Request('http://localhost/api/parts?type=BIKE_PART')
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    expect(prisma.part.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ brand: 'Suzuki', type: 'BIKE_PART' }) })
    )
  })
})

describe('POST /api/parts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue({ status: 403, message: 'Admin access required' })
    const req = new Request('http://localhost/api/parts', {
      method: 'POST',
      body: JSON.stringify({ type: 'BIKE_PART', partName: 'Air Filter', price: 100, quantity: 5 }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/parts/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on successful admin delete', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.part.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    ;(prisma.part.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    const req = new Request('http://localhost/api/parts/5', { method: 'DELETE' })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: '5' }) })
    expect(res.status).toBe(204)
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/parts.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 4: Write `web/app/api/parts/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { partInputSchema, partTypeEnum } from '@/lib/validations/part'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const typeParam = searchParams.get('type')
    const type = typeParam ? partTypeEnum.parse(typeParam) : undefined

    const parts = await prisma.part.findMany({
      where: {
        brand: 'Suzuki',
        ...(type ? { type } : {}),
        ...(q
          ? { OR: [
              { partName: { contains: q, mode: 'insensitive' as const } },
              { compatibleModel: { contains: q, mode: 'insensitive' as const } },
            ] }
          : {}),
      },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(parts)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = partInputSchema.parse(body)
    const part = await prisma.part.create({ data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(part, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 5: Write `web/app/api/parts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { partInputSchema } from '@/lib/validations/part'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const part = await prisma.part.findUnique({ where: { id: Number(id) } })
    if (!part) throw new ApiError(404, 'Part not found')
    return NextResponse.json(part)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = partInputSchema.parse(body)
    const existing = await prisma.part.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Part not found')
    const part = await prisma.part.update({ where: { id: Number(id) }, data: { ...data, brand: 'Suzuki' } })
    return NextResponse.json(part)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.part.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Part not found')
    await prisma.part.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/parts.test.ts`
Expected: 3 passed

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add parts API route handlers"
```

---

### Task 11: Parts pages (public + admin)

**Files:**
- Create: `web/app/(site)/parts/page.tsx`
- Create: `web/app/(site)/parts/[id]/page.tsx`
- Test: `web/tests/app/parts-detail.test.tsx`

**Interfaces:**
- Consumes: `PartCard`, `AddEditModal`, `ConfirmDeleteDialog`, `PartCategoryTabs`, `SkeletonGrid`, `LoadingSpinner`, `Footer` (Tasks 6/8), `partInputSchema` (Task 10), `formatNPR`/`getImageUrl` (Task 1). Fetches `GET/POST/PUT/DELETE /api/parts(/:id)` (Task 10).
- Produces: `/parts`, `/parts/:id` pages. `PartCard` is rendered here WITHOUT `onAddToCart` (no cart yet) — Task 13 modifies both files to wire cart in.

- [ ] **Step 1: Write `web/app/(site)/parts/page.tsx`**

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import PartCard from '@/components/PartCard'
import Footer from '@/components/Footer'
import { PartCategoryTabs } from '@/components/CategoryTabs'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search } from 'lucide-react'
import type { Part } from '@prisma/client'

interface PartFormState {
  type: 'BIKE_PART' | 'SCOOTER_PART'
  partName: string
  compatibleModel: string
  price: number
  quantity: number
  imageUrl: string
}

const emptyForm: PartFormState = { type: 'BIKE_PART', partName: '', compatibleModel: '', price: 0, quantity: 0, imageUrl: '' }

export default function PartsPage() {
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'

  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'BIKE_PART' | 'SCOOTER_PART'>('BIKE_PART')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null)
  const [editing, setEditing] = useState<Part | null>(null)
  const [form, setForm] = useState<PartFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({ type: typeFilter })
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    const res = await fetch(`/api/parts?${params}`)
    setParts(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [typeFilter])

  const displayList = useMemo(() => [...parts].sort((a, b) => a.id - b.id), [parts])

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, type: typeFilter }); setModalOpen(true) }
  const openEdit = (p: Part) => {
    setEditing(p)
    setForm({ type: p.type, partName: p.partName, compatibleModel: p.compatibleModel ?? '', price: p.price, quantity: p.quantity, imageUrl: p.imageUrl ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, compatibleModel: form.compatibleModel || undefined, imageUrl: form.imageUrl || undefined }
    const url = editing ? `/api/parts/${editing.id}` : '/api/parts'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setModalOpen(false); await fetchData() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/parts/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setDeleteTarget(null); await fetchData() }
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{typeFilter === 'BIKE_PART' ? 'Suzuki Bike Parts' : 'Suzuki Scooter Parts'}</h1>
              <p className="text-zinc-600 text-sm mt-1">{displayList.length} part(s)</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Add Part
              </Button>
            )}
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <PartCategoryTabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'BIKE_PART' | 'SCOOTER_PART')} />
            <form onSubmit={(e) => { e.preventDefault(); fetchData() }} className="flex-1 flex gap-2 min-w-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input placeholder="Search by name or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
              </div>
              <Button type="submit" variant="outline" className="rounded-xl shrink-0">Search</Button>
            </form>
          </div>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading parts..." />
          ) : displayList.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-600 text-lg font-medium">No parts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayList.map((p, i) => (
                <PartCard
                  key={p.id}
                  serialNumber={i + 1}
                  part={p}
                  onEdit={isAdmin ? openEdit : undefined}
                  onDelete={isAdmin ? (part) => setDeleteTarget(part) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Part' : 'Add Part'} onSubmit={onSubmit} loading={saving} submitLabel={editing ? 'Update' : 'Add'}>
        <div>
          <Label>Category</Label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'BIKE_PART' | 'SCOOTER_PART' })} className="w-full h-11 px-3 border border-zinc-200 rounded-xl mt-1">
            <option value="BIKE_PART">Bike Part</option>
            <option value="SCOOTER_PART">Scooter Part</option>
          </select>
        </div>
        <div><Label>Part Name *</Label><Input value={form.partName} onChange={(e) => setForm({ ...form, partName: e.target.value })} className="mt-1" required /></div>
        <div><Label>Compatible Model</Label><Input value={form.compatibleModel} onChange={(e) => setForm({ ...form, compatibleModel: e.target.value })} className="mt-1" /></div>
        <div><Label>Price (Rs)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="mt-1" /></div>
      </AddEditModal>

      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Part" itemName={deleteTarget?.partName} onConfirm={handleDelete} loading={deleting} />

      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Write `web/app/(site)/parts/[id]/page.tsx`**

```typescript
'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatNPR } from '@/lib/currency'
import { getImageUrl } from '@/lib/images'
import { partDescription } from '@/lib/catalogDescriptions'
import type { Part } from '@prisma/client'

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [part, setPart] = useState<Part | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/parts/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setPart)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner className="min-h-[60vh]" label="Loading..." />
  if (!part) return <div className="py-24 text-center text-zinc-500">Part not found.</div>

  const isLowStock = (part.quantity ?? 0) <= 5

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6"><Link href="/parts">← Back to Parts</Link></Button>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="md:w-1/2 aspect-[4/3] bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getImageUrl(part)} alt={part.partName} className="w-full h-full object-cover" />
            </div>
            <div className="md:w-1/2 p-8">
              <Badge variant="secondary" className="mb-3">{part.type.replace('_', ' ')}</Badge>
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">{part.partName}</h1>
              <p className="text-zinc-600 mb-4">{partDescription(part)}</p>
              <p className="text-3xl font-bold text-[#E60012] mb-4">{formatNPR(part.price)}</p>
              <Badge variant={isLowStock ? 'destructive' : 'success'} className="mb-6">
                Stock: {part.quantity ?? 0} {isLowStock && '(Low Stock)'}
              </Badge>
              <Button asChild variant="outline"><Link href="/parts">View All Parts</Link></Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Write the failing test**

`web/tests/app/parts-detail.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PartDetailPage from '@/app/(site)/parts/[id]/page'

vi.mock('next/navigation', () => ({ useParams: () => ({ id: '1' }) }))

describe('PartDetailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 1, type: 'BIKE_PART', brand: 'Suzuki', partName: 'Air Filter', compatibleModel: null, price: 850, quantity: 50, imageUrl: null }),
    })) as unknown as typeof fetch
  })

  it('renders the fetched part', async () => {
    render(<PartDetailPage />)
    await waitFor(() => expect(screen.getByText('Air Filter')).toBeInTheDocument())
    expect(screen.getByText(/Rs 850/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run test, verify pass**

Run: `cd web && npm test -- tests/app/parts-detail.test.tsx`
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add parts list and detail pages"
```

---

### Task 12: Offers API + pages

**Files:**
- Create: `web/lib/validations/offer.ts`
- Create: `web/app/api/offers/route.ts`
- Create: `web/app/api/offers/[id]/route.ts`
- Create: `web/app/(site)/offers/page.tsx`
- Test: `web/tests/api/offers.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireAdmin`, `ApiError`/`handleApiError` (Tasks 1/3/5), `AddEditModal`, `ConfirmDeleteDialog`, `Footer`, `Button`, `Input`, `Label`, `Badge` (Tasks 2/6/8).
- Produces: `offerInputSchema` from `lib/validations/offer.ts`. Route contract: `GET /api/offers` (public, ordered by id desc), `GET /api/offers/:id` (public), `POST /api/offers` (admin), `PUT /api/offers/:id` (admin), `DELETE /api/offers/:id` (admin) → 204. Page: `/offers`.

- [ ] **Step 1: Write `web/lib/validations/offer.ts`**

```typescript
import { z } from 'zod'

export const offerInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
})

export type OfferInput = z.infer<typeof offerInputSchema>
```

- [ ] **Step 2: Write the failing test**

`web/tests/api/offers.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { offer: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/offers/route'

describe('GET /api/offers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists offers ordered by id desc', async () => {
    ;(prisma.offer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 2 }, { id: 1 }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(prisma.offer.findMany).toHaveBeenCalledWith({ orderBy: { id: 'desc' } })
  })
})

describe('POST /api/offers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue({ status: 403, message: 'Admin access required' })
    const req = new Request('http://localhost/api/offers', { method: 'POST', body: JSON.stringify({ title: 'Sale' }) })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('creates an offer for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.offer.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 3, title: 'Sale' })
    const req = new Request('http://localhost/api/offers', { method: 'POST', body: JSON.stringify({ title: 'Sale' }) })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/offers.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 4: Write `web/app/api/offers/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { offerInputSchema } from '@/lib/validations/offer'

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({ orderBy: { id: 'desc' } })
    return NextResponse.json(offers)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = offerInputSchema.parse(body)
    const offer = await prisma.offer.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })
    return NextResponse.json(offer, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 5: Write `web/app/api/offers/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { offerInputSchema } from '@/lib/validations/offer'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const offer = await prisma.offer.findUnique({ where: { id: Number(id) } })
    if (!offer) throw new ApiError(404, 'Offer not found')
    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = offerInputSchema.parse(body)
    const existing = await prisma.offer.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Offer not found')
    const offer = await prisma.offer.update({
      where: { id: Number(id) },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })
    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.offer.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Offer not found')
    await prisma.offer.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/offers.test.ts`
Expected: 3 passed

- [ ] **Step 7: Write `web/app/(site)/offers/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Footer from '@/components/Footer'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import type { Offer } from '@prisma/client'

interface OfferFormState {
  title: string
  description: string
  discountPercent: string
  startDate: string
  endDate: string
  imageUrl: string
}

const emptyForm: OfferFormState = { title: '', description: '', discountPercent: '', startDate: '', endDate: '', imageUrl: '' }

function offerBadgeLabel(offer: Offer): string {
  if (offer.discountPercent) return `${offer.discountPercent}% OFF`
  const today = new Date().toISOString().slice(0, 10)
  const end = offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : null
  const start = offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : null
  if (end && end < today) return 'Expired'
  if (start && start > today) return 'Upcoming'
  return 'Active'
}

export default function OffersPage() {
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [form, setForm] = useState<OfferFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchOffers = async () => {
    setLoading(true)
    const res = await fetch('/api/offers')
    setOffers(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchOffers() }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (offer: Offer) => {
    setEditing(offer)
    setForm({
      title: offer.title,
      description: offer.description ?? '',
      discountPercent: offer.discountPercent?.toString() ?? '',
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : '',
      imageUrl: offer.imageUrl ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || null,
      discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      imageUrl: form.imageUrl || null,
    }
    const url = editing ? `/api/offers/${editing.id}` : '/api/offers'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setModalOpen(false); await fetchOffers() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/offers/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setDeleteTarget(null); await fetchOffers() }
  }

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Special Offers</h1>
              <p className="text-zinc-500 text-sm mt-1">Exclusive deals and discounts from Suzuki Nepal</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Add Offer
              </Button>
            )}
          </div>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading offers..." />
          ) : offers.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Tag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium">No offers available right now</p>
            </div>
          ) : (
            <div className="space-y-5">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="h-1 bg-[#E60012]" />
                  <div className="p-6 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Badge className="mb-3 bg-[#E60012] text-white">{offerBadgeLabel(offer)}</Badge>
                      <h2 className="text-xl font-bold text-zinc-900 mb-2">{offer.title}</h2>
                      {offer.description && <p className="text-zinc-600 text-sm leading-relaxed">{offer.description}</p>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(offer)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-red-600 hover:bg-red-50 border-red-200" onClick={() => setDeleteTarget(offer)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Offer' : 'Add Offer'} onSubmit={onSubmit} loading={saving} submitLabel={editing ? 'Update' : 'Add'}>
        <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" required /></div>
        <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y min-h-[80px]" /></div>
        <div><Label>Discount % (optional)</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
          <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1" /></div>
        </div>
        <div><Label>Image URL (optional)</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="mt-1" /></div>
      </AddEditModal>

      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Offer" itemName={deleteTarget?.title} onConfirm={handleDelete} loading={deleting} />

      <Footer />
    </>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add offers API and offers page"
```

---

### Task 13: Cart context + cart page

**Files:**
- Create: `web/cart/CartContext.tsx`
- Create: `web/app/(site)/cart/page.tsx`
- Modify: `web/app/layout.tsx` (wrap children in `CartProvider`, inside `ClerkProvider`)
- Modify: `web/app/(site)/parts/page.tsx` (Task 11 — pass `onAddToCart` to `PartCard`)
- Modify: `web/app/(site)/parts/[id]/page.tsx` (Task 11 — add an "Add to Cart" button)
- Test: `web/tests/cart/CartContext.test.tsx`

**Interfaces:**
- Produces: `CartProvider`, `useCart(): { items: CartItem[]; totalItems: number; totalAmount: number; addToCart(part: Part): void; updateQuantity(partId: number, quantity: number): void; removeFromCart(partId: number): void; clearCart(): void }` where `CartItem = { partId: number; partName: string; price: number; quantity: number }`. This is the exact shape Task 15 (checkout) consumes.

- [ ] **Step 1: Write `web/cart/CartContext.tsx`**

```typescript
'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Part } from '@prisma/client'

const CART_STORAGE_KEY = 'suzuki_cart'

export interface CartItem {
  partId: number
  partName: string
  price: number
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  addToCart: (part: Part) => void
  updateQuantity: (partId: number, quantity: number) => void
  removeFromCart: (partId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToCart = (part: Part) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.partId === part.id)
      if (existing) {
        return prev.map((item) => (item.partId === part.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { partId: part.id, partName: part.partName, price: part.price, quantity: 1 }]
    })
  }

  const updateQuantity = (partId: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(partId); return }
    setItems((prev) => prev.map((item) => (item.partId === partId ? { ...item, quantity } : item)))
  }

  const removeFromCart = (partId: number) => {
    setItems((prev) => prev.filter((item) => item.partId !== partId))
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, totalItems, totalAmount, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
```

- [ ] **Step 2: Write the failing test**

`web/tests/cart/CartContext.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CartProvider, useCart } from '@/cart/CartContext'
import type { Part } from '@prisma/client'

const samplePart = { id: 1, type: 'BIKE_PART', brand: 'Suzuki', partName: 'Air Filter', compatibleModel: null, price: 850, quantity: 50, imageUrl: null } as Part

function TestHarness() {
  const { items, totalAmount, addToCart, updateQuantity } = useCart()
  return (
    <div>
      <button onClick={() => addToCart(samplePart)}>add</button>
      <button onClick={() => updateQuantity(1, 3)}>set-qty-3</button>
      <span data-testid="count">{items.length}</span>
      <span data-testid="total">{totalAmount}</span>
    </div>
  )
}

describe('CartContext', () => {
  beforeEach(() => window.localStorage.clear())

  it('adds a part to the cart and increments quantity on repeat add', () => {
    render(<CartProvider><TestHarness /></CartProvider>)
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('total').textContent).toBe('1700')
  })

  it('updates quantity directly', () => {
    render(<CartProvider><TestHarness /></CartProvider>)
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('set-qty-3'))
    expect(screen.getByTestId('total').textContent).toBe('2550')
  })
})
```

- [ ] **Step 3: Run test, verify pass**

Run: `cd web && npm test -- tests/cart/CartContext.test.tsx`
Expected: 2 passed

- [ ] **Step 4: Modify `web/app/layout.tsx` to add `CartProvider`**

```typescript
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { CartProvider } from '@/cart/CartContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suzuki Bike System',
  description: 'Suzuki Motorcycle Nepal — bikes, scooters, parts, and service',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <CartProvider>{children}</CartProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 5: Write `web/app/(site)/cart/page.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { useCart } from '@/cart/CartContext'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { formatNPR } from '@/lib/currency'

export default function CartPage() {
  const { items, totalAmount, updateQuantity, removeFromCart } = useCart()

  if (items.length === 0) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Your cart is empty</h3>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]"><Link href="/parts">Browse Parts</Link></Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Shopping Cart</h1>
            <Badge variant="secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-6 shadow-sm">
            <div className="divide-y divide-zinc-200">
              {items.map((item) => (
                <div key={item.partId} className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900">{item.partName}</h3>
                    <p className="text-sm text-zinc-600 mt-1">{formatNPR(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border border-zinc-200 rounded-xl">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.partId, item.quantity - 1)}><Minus className="w-4 h-4" /></Button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.partId, item.quantity + 1)}><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="w-32 text-right"><p className="font-bold text-zinc-900">{formatNPR(item.price * item.quantity)}</p></div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.partId)} className="text-[#E60012] hover:text-[#C5000F]"><Trash2 className="w-5 h-5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Total</span><span className="text-[#E60012]">{formatNPR(totalAmount)}</span>
            </div>
            <Button asChild size="lg" className="w-full bg-[#E60012] hover:bg-[#C5000F]"><Link href="/checkout">Proceed to Checkout</Link></Button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 6: Modify `web/app/(site)/parts/page.tsx`** — add cart wiring

In the `import` block, add:

```typescript
import { useCart } from '@/cart/CartContext'
import { useRouter } from 'next/navigation'
```

Inside `PartsPage`, after the existing `const { user } = useUser()` line, add:

```typescript
  const { isSignedIn } = useUser()
  const { addToCart } = useCart()
  const router = useRouter()
```

(Note: `useUser()` is already called once for `isAdmin` — extend that single destructure instead of calling the hook twice: change `const { user } = useUser()` to `const { user, isSignedIn } = useUser()`.)

In the non-admin `<PartCard>` render, add the `onAddToCart` prop:

```typescript
<PartCard
  key={p.id}
  serialNumber={i + 1}
  part={p}
  onEdit={isAdmin ? openEdit : undefined}
  onDelete={isAdmin ? (part) => setDeleteTarget(part) : undefined}
  onAddToCart={
    !isAdmin
      ? (part) => {
          if (!isSignedIn) { router.push('/sign-in'); return }
          addToCart(part)
        }
      : undefined
  }
/>
```

- [ ] **Step 7: Modify `web/app/(site)/parts/[id]/page.tsx`** — add "Add to Cart" button

In the `import` block, add:

```typescript
import { useCart } from '@/cart/CartContext'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
```

Inside `PartDetailPage`, after `const { id } = useParams<{ id: string }>()`, add:

```typescript
  const { isSignedIn } = useUser()
  const { addToCart } = useCart()
  const router = useRouter()
```

Replace the final `<Button asChild variant="outline"><Link href="/parts">View All Parts</Link></Button>` line with:

```typescript
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-[#E60012] hover:bg-[#C5000F]"
                  onClick={() => {
                    if (!isSignedIn) { router.push('/sign-in'); return }
                    addToCart(part)
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                </Button>
                <Button asChild variant="outline"><Link href="/parts">View All Parts</Link></Button>
              </div>
```

- [ ] **Step 8: Run the full test suite, verify nothing regressed**

Run: `cd web && npm test`
Expected: all tests pass

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add cart context, cart page, and wire Add to Cart into parts pages"
```

---

### Task 14: Stripe create-intent + webhook + order service

**Files:**
- Create: `web/lib/stripe.ts`
- Create: `web/lib/orders.ts`
- Create: `web/lib/validations/order.ts`
- Create: `web/app/api/payments/create-intent/route.ts`
- Create: `web/app/api/payments/webhook/route.ts`
- Test: `web/tests/lib/orders.test.ts`
- Test: `web/tests/api/payments.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 3), `requireUser` (Task 5), `ApiError`/`handleApiError` (Task 1).
- Produces: `createOrderDraft(user, customerName, phone, email, address, items): Promise<Order & { items: OrderItem[] }>`, `finalizeOrder(orderId: number): Promise<void>`, `setStripePaymentIntentId(orderId: number, paymentIntentId: string): Promise<void>`, `findOrderByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null>` from `lib/orders.ts` — Task 16 (orders pages/API) and Task 23 (email) both import these. `stripe: Stripe` singleton from `lib/stripe.ts`.

- [ ] **Step 1: Install Stripe**

```bash
cd web
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

- [ ] **Step 2: Write `web/lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
```

- [ ] **Step 3: Write `web/lib/validations/order.ts`**

```typescript
import { z } from 'zod'

export const orderItemInputSchema = z.object({
  partId: z.number().int().positive(),
  quantity: z.number().int().min(1),
})

export const createIntentSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().max(100).optional().nullable(),
  address: z.string().min(1, 'Address is required').max(500),
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required'),
})

export type CreateIntentInput = z.infer<typeof createIntentSchema>
export type OrderItemInput = z.infer<typeof orderItemInputSchema>
```

- [ ] **Step 4: Write the failing test for `lib/orders.ts`**

`web/tests/lib/orders.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const txMock = {
  part: { findUnique: vi.fn(), update: vi.fn() },
  order: { create: vi.fn(), update: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => unknown) => cb(txMock)),
  },
}))

import { prisma } from '@/lib/prisma'
import { createOrderDraft, finalizeOrder } from '@/lib/orders'
import { ApiError } from '@/lib/api-error'
import type { User } from '@prisma/client'

const user = { id: 1, role: 'CLIENT' } as User

describe('createOrderDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('computes the total server-side from current Part prices, ignoring any client-sent price', async () => {
    txMock.part.findUnique.mockResolvedValue({ id: 10, partName: 'Air Filter', price: 850, quantity: 50 })
    txMock.order.create.mockResolvedValue({ id: 1, totalAmount: 1700, items: [] })

    const order = await createOrderDraft(user, 'John', '9800000000', null, 'Kathmandu', [{ partId: 10, quantity: 2 }])

    expect(txMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 1700,
          items: { create: [{ partId: 10, partName: 'Air Filter', price: 850, quantity: 2 }] },
        }),
      })
    )
    expect(order.id).toBe(1)
  })

  it('throws 400 when requested quantity exceeds stock', async () => {
    txMock.part.findUnique.mockResolvedValue({ id: 10, partName: 'Air Filter', price: 850, quantity: 1 })

    await expect(
      createOrderDraft(user, 'John', '9800000000', null, 'Kathmandu', [{ partId: 10, quantity: 2 }])
    ).rejects.toMatchObject({ status: 400 })
  })

  it('throws 404 when the part does not exist', async () => {
    txMock.part.findUnique.mockResolvedValue(null)

    await expect(
      createOrderDraft(user, 'John', '9800000000', null, 'Kathmandu', [{ partId: 999, quantity: 1 }])
    ).rejects.toMatchObject({ status: 404 })
  })
})

describe('finalizeOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is a no-op when the order is already PAID', async () => {
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, status: 'PAID', items: [] })
    await finalizeOrder(1)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('reduces stock and sets status PAID', async () => {
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, status: 'PENDING', items: [{ partId: 10, quantity: 2 }],
    })
    txMock.part.findUnique.mockResolvedValue({ id: 10, partName: 'Air Filter', quantity: 5 })

    await finalizeOrder(1)

    expect(txMock.part.update).toHaveBeenCalledWith({ where: { id: 10 }, data: { quantity: 3 } })
    expect(txMock.order.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'PAID' } })
  })

  it('routes to PAYMENT_REVIEW and throws when stock is insufficient after payment', async () => {
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, status: 'PENDING', items: [{ partId: 10, quantity: 5 }],
    })
    txMock.part.findUnique.mockResolvedValue({ id: 10, partName: 'Air Filter', quantity: 2 })

    await expect(finalizeOrder(1)).rejects.toMatchObject({ status: 409 })
    expect(txMock.order.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'PAYMENT_REVIEW' } })
  })
})
```

- [ ] **Step 5: Run test, verify it fails**

Run: `cd web && npm test -- tests/lib/orders.test.ts`
Expected: FAIL (`lib/orders.ts` doesn't exist)

- [ ] **Step 6: Write `web/lib/orders.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import type { User, Order, OrderItem } from '@prisma/client'
import type { OrderItemInput } from '@/lib/validations/order'

export async function createOrderDraft(
  user: User,
  customerName: string,
  phone: string,
  email: string | null,
  address: string,
  items: OrderItemInput[]
): Promise<Order & { items: OrderItem[] }> {
  return prisma.$transaction(async (tx) => {
    let totalAmount = 0
    const itemsData: { partId: number; partName: string; price: number; quantity: number }[] = []

    for (const item of items) {
      const part = await tx.part.findUnique({ where: { id: item.partId } })
      if (!part) throw new ApiError(404, `Part not found: ${item.partId}`)
      if (part.quantity < item.quantity) throw new ApiError(400, `Insufficient stock for part: ${part.partName}`)
      totalAmount += part.price * item.quantity
      itemsData.push({ partId: part.id, partName: part.partName, price: part.price, quantity: item.quantity })
    }

    return tx.order.create({
      data: {
        customerName,
        phone,
        email,
        address,
        totalAmount,
        status: 'PENDING',
        userId: user.id,
        items: { create: itemsData },
      },
      include: { items: true },
    })
  })
}

export async function finalizeOrder(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) throw new ApiError(404, 'Order not found')
  if (order.status === 'PAID') return

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const part = await tx.part.findUnique({ where: { id: item.partId } })
      if (!part) throw new ApiError(404, `Part not found: ${item.partId}`)
      const newQuantity = part.quantity - item.quantity
      if (newQuantity < 0) {
        await tx.order.update({ where: { id: orderId }, data: { status: 'PAYMENT_REVIEW' } })
        throw new ApiError(409, `Insufficient stock for part: ${part.partName} after payment`)
      }
      await tx.part.update({ where: { id: part.id }, data: { quantity: newQuantity } })
    }
    await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } })
  })
}

export async function setStripePaymentIntentId(orderId: number, paymentIntentId: string): Promise<void> {
  await prisma.order.update({ where: { id: orderId }, data: { stripePaymentIntentId: paymentIntentId } })
}

export async function findOrderByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  return prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
}
```

Note: `findOrderByStripePaymentIntentId` requires `stripePaymentIntentId` to be a unique lookup key. Add `@unique` to that field — modify `web/prisma/schema.prisma`'s `Order.stripePaymentIntentId` line (from Task 3) to:

```prisma
  stripePaymentIntentId String?     @unique @map("stripe_payment_intent_id")
```

Run `npx prisma migrate dev --name order_payment_intent_unique` to apply this index change.

- [ ] **Step 7: Run test, verify it passes**

Run: `cd web && npm test -- tests/lib/orders.test.ts`
Expected: 6 passed

- [ ] **Step 8: Write the failing test for the payment routes**

`web/tests/api/payments.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const requireUserMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUserMock() }))

const createOrderDraftMock = vi.fn()
const setStripePaymentIntentIdMock = vi.fn()
const findOrderByStripePaymentIntentIdMock = vi.fn()
const finalizeOrderMock = vi.fn()
vi.mock('@/lib/orders', () => ({
  createOrderDraft: (...args: unknown[]) => createOrderDraftMock(...args),
  setStripePaymentIntentId: (...args: unknown[]) => setStripePaymentIntentIdMock(...args),
  findOrderByStripePaymentIntentId: (...args: unknown[]) => findOrderByStripePaymentIntentIdMock(...args),
  finalizeOrder: (...args: unknown[]) => finalizeOrderMock(...args),
}))

const paymentIntentsCreateMock = vi.fn()
const constructEventMock = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { create: (...args: unknown[]) => paymentIntentsCreateMock(...args) },
    webhooks: { constructEvent: (...args: unknown[]) => constructEventMock(...args) },
  },
}))

import { POST as createIntent } from '@/app/api/payments/create-intent/route'
import { POST as webhook } from '@/app/api/payments/webhook/route'

describe('POST /api/payments/create-intent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_CURRENCY = 'usd'
  })

  it('requires authentication', async () => {
    requireUserMock.mockRejectedValue({ status: 401, message: 'Not authenticated' })
    const req = new Request('http://localhost/api/payments/create-intent', { method: 'POST', body: JSON.stringify({}) })
    const res = await createIntent(req as never)
    expect(res.status).toBe(401)
  })

  it('creates a draft order and a Stripe PaymentIntent, returns clientSecret', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })
    createOrderDraftMock.mockResolvedValue({ id: 5, totalAmount: 1700 })
    paymentIntentsCreateMock.mockResolvedValue({ id: 'pi_123', client_secret: 'secret_abc' })

    const req = new Request('http://localhost/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'John', phone: '9800000000', address: 'Kathmandu',
        items: [{ partId: 10, quantity: 2 }],
      }),
    })
    const res = await createIntent(req as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ clientSecret: 'secret_abc', orderDraftId: 5 })
    expect(paymentIntentsCreateMock).toHaveBeenCalledWith(expect.objectContaining({ amount: 170000, currency: 'usd' }))
    expect(setStripePaymentIntentIdMock).toHaveBeenCalledWith(5, 'pi_123')
  })
})

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('rejects a request with an invalid signature', async () => {
    constructEventMock.mockImplementation(() => { throw new Error('bad sig') })
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST', body: '{}', headers: { 'stripe-signature': 'bad' },
    })
    const res = await webhook(req as never)
    expect(res.status).toBe(400)
  })

  it('finalizes the matching order on payment_intent.succeeded', async () => {
    constructEventMock.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    })
    findOrderByStripePaymentIntentIdMock.mockResolvedValue({ id: 5 })

    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST', body: '{}', headers: { 'stripe-signature': 'sig_valid' },
    })
    const res = await webhook(req as never)

    expect(res.status).toBe(200)
    expect(finalizeOrderMock).toHaveBeenCalledWith(5)
  })
})
```

- [ ] **Step 9: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/payments.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 10: Write `web/app/api/payments/create-intent/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { stripe } from '@/lib/stripe'
import { createOrderDraft, setStripePaymentIntentId } from '@/lib/orders'
import { createIntentSchema } from '@/lib/validations/order'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const data = createIntentSchema.parse(body)

    const order = await createOrderDraft(user, data.customerName, data.phone, data.email ?? null, data.address, data.items)

    const amountCents = Math.round(order.totalAmount * 100)
    if (amountCents < 50) throw new ApiError(400, 'Minimum amount is 0.50')

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: process.env.STRIPE_CURRENCY ?? 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: String(order.id) },
    })

    await setStripePaymentIntentId(order.id, intent.id)

    return NextResponse.json({ clientSecret: intent.client_secret, orderDraftId: order.id })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 11: Write `web/app/api/payments/webhook/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { findOrderByStripePaymentIntentId, finalizeOrder } from '@/lib/orders'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ message: 'Webhook not configured' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ message: 'Missing signature' }, { status: 400 })

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const order = await findOrderByStripePaymentIntentId(paymentIntent.id)
    if (order) {
      try {
        await finalizeOrder(order.id)
      } catch (err) {
        console.error('Order finalization failed:', err)
        return NextResponse.json({ ok: true, message: 'Order finalization failed' })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 12: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/payments.test.ts`
Expected: 4 passed

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add Stripe create-intent/webhook routes and order draft/finalize service"
```

---

### Task 15: Checkout + success pages

**Files:**
- Create: `web/app/(site)/checkout/page.tsx`
- Create: `web/app/(site)/checkout/success/page.tsx`
- Test: `web/tests/app/checkout.test.tsx`

**Interfaces:**
- Consumes: `useCart` (Task 13), `CreateIntentInput` shape (Task 14 — `POST /api/payments/create-intent` body: `{ customerName, phone, email?, address, items: [{ partId, quantity }] }`, response `{ clientSecret, orderDraftId }`), `Button`/`Input`/`Label`/`Textarea` (Task 2), `Footer` (Task 6), `formatNPR` (Task 1).

- [ ] **Step 1: Write `web/app/(site)/checkout/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '@/cart/CartContext'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatNPR } from '@/lib/currency'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder')

interface CheckoutFormData {
  customerName: string
  phone: string
  email: string
  address: string
}

function PaymentForm({ totalAmount, onSuccess }: { totalAmount: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success` },
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} size="lg" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
        {loading ? 'Processing...' : `Pay ${formatNPR(totalAmount)}`}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalAmount, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [formData, setFormData] = useState<CheckoutFormData>({ customerName: '', phone: '', email: '', address: '' })
  const [error, setError] = useState<string | null>(null)

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address,
        items: items.map((item) => ({ partId: item.partId, quantity: item.quantity })),
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to create payment')
      return
    }

    const body = await res.json()
    setClientSecret(body.clientSecret)
    setStep('payment')
  }

  const onPaymentSuccess = () => {
    clearCart()
    router.push('/checkout/success?redirect_status=succeeded')
  }

  if (items.length === 0 && step === 'form') {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm">
              <p className="text-zinc-600 text-lg mb-4">Your cart is empty.</p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]"><Link href="/parts">Browse Parts</Link></Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Checkout</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 'form' ? (
                <form onSubmit={onFormSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">Shipping Information</h2>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div><Label htmlFor="customerName">Full Name *</Label><Input id="customerName" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="phone">Phone *</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" /></div>
                  <div><Label htmlFor="address">Address *</Label><Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={4} required className="mt-1" /></div>
                  <Button type="submit" disabled={loading} size="lg" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
                    {loading ? 'Creating payment...' : 'Continue to Payment'}
                  </Button>
                </form>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">Pay with Card</h2>
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#E60012' } } }}>
                      <PaymentForm totalAmount={totalAmount} onSuccess={onPaymentSuccess} />
                    </Elements>
                  )}
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm sticky top-24">
                <h3 className="font-semibold text-zinc-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.partId} className="flex justify-between text-sm">
                      <span className="text-zinc-600">{item.partName} × {item.quantity}</span>
                      <span className="font-semibold">{formatNPR(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-200 pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span><span className="text-[#E60012]">{formatNPR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Write `web/app/(site)/checkout/success/page.tsx`**

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('redirect_status')

  return (
    <>
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          {status === 'succeeded' ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">Payment Successful!</h1>
              <p className="text-zinc-600 mb-8">Your order has been placed successfully. You will receive an email confirmation shortly.</p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]"><Link href="/">Return to Home</Link></Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">Checkout</h1>
              <p className="text-zinc-600 mb-8">
                {status === 'processing' ? 'Your payment is being processed...' : 'Something went wrong. Please try again.'}
              </p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]"><Link href="/checkout">Back to Checkout</Link></Button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Write the failing test**

`web/tests/app/checkout.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CheckoutSuccessPage from '@/app/(site)/checkout/success/page'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('redirect_status=succeeded'),
}))

describe('CheckoutSuccessPage', () => {
  it('shows the success message when redirect_status=succeeded', () => {
    render(<CheckoutSuccessPage />)
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run test, verify pass**

Run: `cd web && npm test -- tests/app/checkout.test.tsx`
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add checkout and checkout success pages with Stripe Elements"
```

---

### Task 16: Orders API + pages

**Files:**
- Modify: `web/lib/validations/order.ts` (Task 14 — add `orderStatusSchema`)
- Create: `web/app/api/orders/my/route.ts`
- Create: `web/app/api/orders/route.ts`
- Create: `web/app/api/orders/[id]/status/route.ts`
- Create: `web/app/(site)/my-orders/page.tsx`
- Create: `web/app/(site)/admin/orders/page.tsx`
- Test: `web/tests/api/orders.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireUser`, `requireAdmin` (Tasks 3/5), `formatNPR` (Task 1), `Badge`, `Dialog*` (Task 2).
- Produces: `GET /api/orders/my` (authenticated — current user's orders + items), `GET /api/orders` (admin — all orders + items), `PUT /api/orders/:id/status` (admin, body `{ status: OrderStatus }`). Pages: `/my-orders`, `/admin/orders`.

- [ ] **Step 1: Modify `web/lib/validations/order.ts`** — append:

```typescript
export const orderStatusEnum = z.enum(['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'PAYMENT_REVIEW', 'FAILED'])

export const orderStatusUpdateSchema = z.object({ status: orderStatusEnum })
```

- [ ] **Step 2: Write the failing test**

`web/tests/api/orders.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}))

const requireUserMock = vi.fn()
const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  requireUser: () => requireUserMock(),
  requireAdmin: () => requireAdminMock(),
}))

import { prisma } from '@/lib/prisma'
import { GET as GET_MY } from '@/app/api/orders/my/route'
import { GET as GET_ALL } from '@/app/api/orders/route'
import { PUT as PUT_STATUS } from '@/app/api/orders/[id]/status/route'

describe('GET /api/orders/my', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only the current user\'s orders', async () => {
    requireUserMock.mockResolvedValue({ id: 1 })
    ;(prisma.order.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, userId: 1 }])
    const res = await GET_MY()
    expect(res.status).toBe(200)
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } })
    )
  })
})

describe('GET /api/orders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue({ status: 403, message: 'Admin access required' })
    const res = await GET_ALL()
    expect(res.status).toBe(403)
  })
})

describe('PUT /api/orders/[id]/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates order status for an admin caller', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 })
    ;(prisma.order.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5, status: 'SHIPPED' })
    const req = new Request('http://localhost/api/orders/5/status', { method: 'PUT', body: JSON.stringify({ status: 'SHIPPED' }) })
    const res = await PUT_STATUS(req as never, { params: Promise.resolve({ id: '5' }) })
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/orders.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 4: Write `web/app/api/orders/my/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const user = await requireUser()
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 5: Write `web/app/api/orders/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 6: Write `web/app/api/orders/[id]/status/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { orderStatusUpdateSchema } from '@/lib/validations/order'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { status } = orderStatusUpdateSchema.parse(body)
    const existing = await prisma.order.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Order not found')
    const order = await prisma.order.update({ where: { id: Number(id) }, data: { status }, include: { items: true } })
    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 7: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/orders.test.ts`
Expected: 3 passed

- [ ] **Step 8: Write `web/app/(site)/my-orders/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatNPR } from '@/lib/currency'
import type { Order, OrderItem } from '@prisma/client'

type OrderWithItems = Order & { items: OrderItem[] }

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

  useEffect(() => {
    fetch('/api/orders/my')
      .then((res) => (res.ok ? res.json() : []))
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8"><div className="max-w-4xl mx-auto"><Skeleton className="h-8 w-48 mb-8" /><Skeleton className="h-64 w-full rounded-2xl" /></div></div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">My Orders</h1>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center"><p className="text-zinc-600 text-lg">You have no orders yet.</p></div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-zinc-900">Order #{order.id}</p>
                      <p className="text-sm text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={order.status === 'PAID' ? 'default' : order.status === 'PENDING' ? 'secondary' : 'destructive'}>{order.status}</Badge>
                      <p className="font-bold text-[#E60012]">{formatNPR(order.totalAmount)}</p>
                      <p className="text-sm text-zinc-500">{order.items.length} item(s)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order #{selectedOrder?.id}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Total:</strong> {formatNPR(selectedOrder.totalAmount)}</p>
              <ul className="divide-y divide-zinc-200">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="py-2 flex justify-between">
                    <span>{item.partName} x {item.quantity}</span>
                    <span>{formatNPR(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}
```

- [ ] **Step 9: Write `web/app/(site)/admin/orders/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import DataTable from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatNPR } from '@/lib/currency'
import type { Order, OrderItem } from '@prisma/client'

type OrderWithItems = Order & { items: OrderItem[] } & Record<string, unknown>

const STATUS_OPTIONS = ['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'PAYMENT_REVIEW', 'FAILED']

const COLUMNS = [
  { key: 'id', label: 'Order ID' },
  { key: 'customerName', label: 'Customer' },
  { key: 'totalAmount', label: 'Total', render: (v: unknown) => formatNPR(v as number) },
  {
    key: 'status',
    label: 'Status',
    render: (v: unknown) => {
      const variants: Record<string, string> = { PENDING: 'warning', PAID: 'success', CONFIRMED: 'success', SHIPPED: 'secondary', CANCELLED: 'destructive', PAYMENT_REVIEW: 'warning', FAILED: 'destructive' }
      return <Badge variant={(variants[v as string] as never) || 'default'}>{v as string}</Badge>
    },
  },
  { key: 'createdAt', label: 'Date', render: (v: unknown) => new Date(v as string).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/orders')
    setOrders(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await fetch(`/api/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    fetchOrders()
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Orders</h1>
          <DataTable columns={COLUMNS} data={orders} loading={loading} emptyMessage="No orders found." showActions isAdmin onEdit={(row) => setSelectedOrder(row)} />
        </div>
      </div>

      {selectedOrder && (
        <Dialog open onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Order #{selectedOrder.id}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p><span className="text-zinc-600">Name:</span> {selectedOrder.customerName}</p>
                <p><span className="text-zinc-600">Phone:</span> {selectedOrder.phone}</p>
                {selectedOrder.email && <p><span className="text-zinc-600">Email:</span> {selectedOrder.email}</p>}
                <p><span className="text-zinc-600">Address:</span> {selectedOrder.address}</p>
              </div>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50"><tr><th className="px-4 py-2 text-left text-sm font-semibold text-zinc-600">Part</th><th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">Price</th><th className="px-4 py-2 text-center text-sm font-semibold text-zinc-600">Qty</th><th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">Total</th></tr></thead>
                  <tbody className="divide-y divide-zinc-200">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">{item.partName}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatNPR(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatNPR(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                <div>
                  <p className="text-sm text-zinc-600">Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => { handleStatusChange(selectedOrder.id, e.target.value); setSelectedOrder({ ...selectedOrder, status: e.target.value as Order['status'] }) }}
                    className="mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm font-semibold"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="text-right"><p className="text-sm text-zinc-600">Total</p><p className="text-2xl font-bold text-[#E60012]">{formatNPR(selectedOrder.totalAmount)}</p></div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Footer />
    </>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add orders API and my-orders/admin-orders pages"
```

---

### Task 17: Appointments API

**Files:**
- Create: `web/lib/validations/appointment.ts`
- Create: `web/lib/appointments.ts`
- Create: `web/app/api/appointments/route.ts`
- Create: `web/app/api/appointments/my/route.ts`
- Create: `web/app/api/appointments/stats/route.ts`
- Create: `web/app/api/appointments/[id]/route.ts`
- Create: `web/app/api/appointments/[id]/status/route.ts`
- Create: `web/app/api/appointments/[id]/reschedule/route.ts`
- Create: `web/app/api/appointments/[id]/cancel/route.ts`
- Test: `web/tests/api/appointments.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireUser`, `requireAdmin` (Tasks 3/5).
- Produces: `AppointmentDto` (an `Appointment` with `services: ServiceType[]` instead of the raw join-table rows) and `toAppointmentDto(appointment: Appointment & { services: AppointmentService[] }): AppointmentDto` from `lib/appointments.ts` — Task 18's pages consume this exact shape. Route contract: `POST /api/appointments` (auth), `GET /api/appointments/my` (auth), `GET /api/appointments?status=&date=&client=&bikeModel=` (admin), `GET /api/appointments/stats` (admin, returns `{ todayCount, pendingCount, completedCount, inProgressCount, monthlyRevenue }`), `GET /api/appointments/:id` (owner or admin), `PUT /api/appointments/:id/status` (admin), `PUT /api/appointments/:id/reschedule` (owner, only when `status === 'PENDING'`), `PUT /api/appointments/:id/cancel` (owner, only when `status === 'PENDING'`), `DELETE /api/appointments/:id` (admin) → 204.

- [ ] **Step 1: Write `web/lib/validations/appointment.ts`**

```typescript
import { z } from 'zod'

export const serviceTypeEnum = z.enum([
  'OIL_CHANGE', 'ENGINE_REPAIR', 'TIRE_REPLACEMENT', 'BRAKE_SERVICE', 'BATTERY_REPLACEMENT',
  'CHAIN_ADJUSTMENT', 'CHAIN_REPLACEMENT', 'SUSPENSION_REPAIR', 'ELECTRICAL_REPAIR', 'GENERAL_INSPECTION',
  'FULL_SERVICE', 'CLUTCH_REPAIR', 'GEAR_REPAIR', 'COOLING_SYSTEM_REPAIR', 'FUEL_SYSTEM_CLEANING',
  'AIR_FILTER_REPLACEMENT', 'SPARK_PLUG_REPLACEMENT', 'WHEEL_ALIGNMENT', 'WASHING_DETAILING', 'OTHER',
])

export const appointmentStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export const appointmentCreateSchema = z.object({
  bikeModel: z.string().min(1, 'Bike model is required').max(100),
  bikeYear: z.number().int().min(1980).max(2100).optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  services: z.array(serviceTypeEnum).min(1, 'At least one service must be selected'),
  customService: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
})

export const appointmentStatusUpdateSchema = z.object({
  status: appointmentStatusEnum,
  repairNotes: z.string().optional().nullable(),
  serviceNotes: z.string().optional().nullable(),
  mechanicName: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  finalCost: z.number().optional().nullable(),
})

export const appointmentRescheduleSchema = z.object({
  bikeModel: z.string().optional(),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
})

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>
export type AppointmentStatusUpdateInput = z.infer<typeof appointmentStatusUpdateSchema>
export type AppointmentRescheduleInput = z.infer<typeof appointmentRescheduleSchema>
```

- [ ] **Step 2: Write `web/lib/appointments.ts`**

```typescript
import type { Appointment, AppointmentService, ServiceType } from '@prisma/client'

export type AppointmentWithServices = Appointment & { services: AppointmentService[] }

export interface AppointmentDto extends Omit<Appointment, never> {
  services: ServiceType[]
}

export function toAppointmentDto(appointment: AppointmentWithServices): AppointmentDto {
  return { ...appointment, services: appointment.services.map((s) => s.service) }
}
```

- [ ] **Step 3: Write the failing test**

`web/tests/api/appointments.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
  },
}))

const requireUserMock = vi.fn()
const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  requireUser: () => requireUserMock(),
  requireAdmin: () => requireAdminMock(),
}))

import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/appointments/route'
import { GET as GET_MY } from '@/app/api/appointments/my/route'
import { GET as GET_BY_ID } from '@/app/api/appointments/[id]/route'
import { PUT as RESCHEDULE } from '@/app/api/appointments/[id]/reschedule/route'
import { PUT as CANCEL } from '@/app/api/appointments/[id]/cancel/route'

const clientUser = { id: 1, username: 'client1', role: 'CLIENT' }
const otherUser = { id: 2, username: 'other', role: 'CLIENT' }

describe('POST /api/appointments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an appointment owned by the authenticated user', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, clientUsername: 'client1', status: 'PENDING', services: [{ service: 'OIL_CHANGE' }],
    })

    const req = new Request('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ bikeModel: 'Gixxer', services: ['OIL_CHANGE'], preferredDate: '2026-08-01', preferredTime: '10:00 AM' }),
    })
    const res = await POST(req as never)

    expect(res.status).toBe(201)
    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ clientUsername: 'client1', status: 'PENDING' }) })
    )
  })
})

describe('GET /api/appointments/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('denies access to a non-owner, non-admin caller', async () => {
    requireUserMock.mockResolvedValue(otherUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', services: [] })
    const req = new Request('http://localhost/api/appointments/1')
    const res = await GET_BY_ID(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  it('allows the owner', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', services: [] })
    const req = new Request('http://localhost/api/appointments/1')
    const res = await GET_BY_ID(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })
})

describe('PUT /api/appointments/[id]/reschedule', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects rescheduling a non-PENDING appointment', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', status: 'APPROVED' })
    const req = new Request('http://localhost/api/appointments/1/reschedule', { method: 'PUT', body: JSON.stringify({ preferredDate: '2026-09-01', preferredTime: '11:00 AM' }) })
    const res = await RESCHEDULE(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/appointments/[id]/cancel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a caller who does not own the appointment', async () => {
    requireUserMock.mockResolvedValue(otherUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', status: 'PENDING' })
    const req = new Request('http://localhost/api/appointments/1/cancel', { method: 'PUT' })
    const res = await CANCEL(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  it('cancels a PENDING appointment owned by the caller', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, clientUsername: 'client1', status: 'PENDING' })
    ;(prisma.appointment.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, status: 'CANCELLED', services: [] })
    const req = new Request('http://localhost/api/appointments/1/cancel', { method: 'PUT' })
    const res = await CANCEL(req as never, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    expect(prisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'CANCELLED' } }))
  })
})

describe('GET /api/appointments/my', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scopes results to the caller\'s clientUsername', async () => {
    requireUserMock.mockResolvedValue(clientUser)
    ;(prisma.appointment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    await GET_MY()
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientUsername: 'client1' } })
    )
  })
})
```

- [ ] **Step 4: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/appointments.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 5: Write `web/app/api/appointments/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { appointmentCreateSchema, appointmentStatusEnum } from '@/lib/validations/appointment'
import { toAppointmentDto } from '@/lib/appointments'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const data = appointmentCreateSchema.parse(body)

    const appointment = await prisma.appointment.create({
      data: {
        clientUsername: user.username,
        bikeModel: data.bikeModel,
        bikeYear: data.bikeYear ?? null,
        registrationNumber: data.registrationNumber ?? null,
        vin: data.vin ?? null,
        mileage: data.mileage ?? null,
        customService: data.customService ?? null,
        description: data.description ?? null,
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        status: 'PENDING',
        services: { create: data.services.map((service) => ({ service })) },
      },
      include: { services: true },
    })

    return NextResponse.json(toAppointmentDto(appointment), { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status')
    const status = statusParam ? appointmentStatusEnum.parse(statusParam) : undefined
    const date = searchParams.get('date')
    const client = searchParams.get('client')
    const bikeModel = searchParams.get('bikeModel')

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(date ? { preferredDate: new Date(date) } : {}),
        ...(client ? { clientUsername: { contains: client, mode: 'insensitive' as const } } : {}),
        ...(bikeModel ? { bikeModel: { contains: bikeModel, mode: 'insensitive' as const } } : {}),
      },
      include: { services: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(appointments.map(toAppointmentDto))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 6: Write `web/app/api/appointments/my/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { toAppointmentDto } from '@/lib/appointments'

export async function GET() {
  try {
    const user = await requireUser()
    const appointments = await prisma.appointment.findMany({
      where: { clientUsername: user.username },
      include: { services: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(appointments.map(toAppointmentDto))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 7: Write `web/app/api/appointments/stats/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [todayCount, pendingCount, completedCount, inProgressCount, revenueAgg] = await Promise.all([
      prisma.appointment.count({ where: { preferredDate: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.appointment.aggregate({
        _sum: { finalCost: true },
        where: { status: 'COMPLETED', preferredDate: { gte: monthStart, lt: monthEnd } },
      }),
    ])

    return NextResponse.json({
      todayCount,
      pendingCount,
      completedCount,
      inProgressCount,
      monthlyRevenue: revenueAgg._sum.finalCost ?? 0,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 8: Write `web/app/api/appointments/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { toAppointmentDto } from '@/lib/appointments'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params
    const appointment = await prisma.appointment.findUnique({ where: { id: Number(id) }, include: { services: true } })
    if (!appointment) throw new ApiError(404, 'Appointment not found')
    if (user.role !== 'ADMIN' && appointment.clientUsername !== user.username) throw new ApiError(403, 'Access denied')
    return NextResponse.json(toAppointmentDto(appointment))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Appointment not found')
    await prisma.appointment.delete({ where: { id: Number(id) } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 9: Write `web/app/api/appointments/[id]/status/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { appointmentStatusUpdateSchema } from '@/lib/validations/appointment'
import { toAppointmentDto } from '@/lib/appointments'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = appointmentStatusUpdateSchema.parse(body)
    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Appointment not found')

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        status: data.status,
        repairNotes: data.repairNotes ?? existing.repairNotes,
        serviceNotes: data.serviceNotes ?? existing.serviceNotes,
        mechanicName: data.mechanicName ?? existing.mechanicName,
        estimatedCost: data.estimatedCost ?? existing.estimatedCost,
        finalCost: data.finalCost ?? existing.finalCost,
      },
      include: { services: true },
    })
    return NextResponse.json(toAppointmentDto(updated))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 10: Write `web/app/api/appointments/[id]/reschedule/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { appointmentRescheduleSchema } from '@/lib/validations/appointment'
import { toAppointmentDto } from '@/lib/appointments'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()
    const data = appointmentRescheduleSchema.parse(body)
    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Appointment not found')
    if (existing.clientUsername !== user.username) throw new ApiError(403, 'Access denied')
    if (existing.status !== 'PENDING') throw new ApiError(400, 'Only pending appointments can be rescheduled')

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        ...(data.bikeModel ? { bikeModel: data.bikeModel } : {}),
      },
      include: { services: true },
    })
    return NextResponse.json(toAppointmentDto(updated))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 11: Write `web/app/api/appointments/[id]/cancel/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { ApiError, handleApiError } from '@/lib/api-error'
import { toAppointmentDto } from '@/lib/appointments'

type Params = { params: Promise<{ id: string }> }

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params
    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } })
    if (!existing) throw new ApiError(404, 'Appointment not found')
    if (existing.clientUsername !== user.username) throw new ApiError(403, 'Access denied')
    if (existing.status !== 'PENDING') throw new ApiError(400, 'Only pending appointments can be cancelled')

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' },
      include: { services: true },
    })
    return NextResponse.json(toAppointmentDto(updated))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 12: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/appointments.test.ts`
Expected: 7 passed

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add appointments API route handlers"
```

---

### Task 18: Appointment pages

**Files:**
- Create: `web/lib/appointmentConstants.ts`
- Create: `web/app/(site)/book-service/page.tsx`
- Create: `web/app/(site)/my-appointments/page.tsx`
- Create: `web/app/(site)/appointments/[id]/page.tsx`
- Create: `web/app/(site)/admin/appointments/page.tsx`
- Test: `web/tests/lib/appointmentConstants.test.ts`

**Interfaces:**
- Consumes: `AppointmentDto`/`toAppointmentDto` shape (Task 17), all appointment Route Handlers (Task 17), `Footer`, `LoadingSpinner`, `ConfirmDeleteDialog` (Tasks 6/8), `Button`/`Input`/`Label` (Task 2).
- Produces: `SERVICE_TYPES`, `TIME_SLOTS`, `STATUS_CONFIG`, `getServiceLabel(value: string): string` from `lib/appointmentConstants.ts`. Pages: `/book-service`, `/my-appointments`, `/appointments/:id`, `/admin/appointments`.

- [ ] **Step 1: Write `web/lib/appointmentConstants.ts`**

```typescript
export const SERVICE_TYPES = [
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
  { value: 'TIRE_REPLACEMENT', label: 'Tire Replacement' },
  { value: 'BRAKE_SERVICE', label: 'Brake Service' },
  { value: 'BATTERY_REPLACEMENT', label: 'Battery Replacement' },
  { value: 'CHAIN_ADJUSTMENT', label: 'Chain Adjustment' },
  { value: 'CHAIN_REPLACEMENT', label: 'Chain Replacement' },
  { value: 'SUSPENSION_REPAIR', label: 'Suspension Repair' },
  { value: 'ELECTRICAL_REPAIR', label: 'Electrical Repair' },
  { value: 'GENERAL_INSPECTION', label: 'General Inspection' },
  { value: 'FULL_SERVICE', label: 'Full Service' },
  { value: 'CLUTCH_REPAIR', label: 'Clutch Repair' },
  { value: 'GEAR_REPAIR', label: 'Gear Repair' },
  { value: 'COOLING_SYSTEM_REPAIR', label: 'Cooling System Repair' },
  { value: 'FUEL_SYSTEM_CLEANING', label: 'Fuel System Cleaning' },
  { value: 'AIR_FILTER_REPLACEMENT', label: 'Air Filter Replacement' },
  { value: 'SPARK_PLUG_REPLACEMENT', label: 'Spark Plug Replacement' },
  { value: 'WHEEL_ALIGNMENT', label: 'Wheel Alignment' },
  { value: 'WASHING_DETAILING', label: 'Washing & Detailing' },
  { value: 'OTHER', label: 'Other (specify below)' },
] as const

export const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-600' },
}

export function getServiceLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value
}
```

- [ ] **Step 2: Write the failing test**

`web/tests/lib/appointmentConstants.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getServiceLabel, SERVICE_TYPES, TIME_SLOTS } from '@/lib/appointmentConstants'

describe('appointmentConstants', () => {
  it('maps a known service value to its label', () => {
    expect(getServiceLabel('OIL_CHANGE')).toBe('Oil Change')
  })

  it('falls back to the raw value for an unknown service', () => {
    expect(getServiceLabel('SOMETHING_ELSE')).toBe('SOMETHING_ELSE')
  })

  it('has 20 service types and 9 time slots, matching the original app', () => {
    expect(SERVICE_TYPES).toHaveLength(20)
    expect(TIME_SLOTS).toHaveLength(9)
  })
})
```

- [ ] **Step 3: Run test, verify pass**

Run: `cd web && npm test -- tests/lib/appointmentConstants.test.ts`
Expected: 3 passed

- [ ] **Step 4: Write `web/app/(site)/book-service/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SERVICE_TYPES, TIME_SLOTS } from '@/lib/appointmentConstants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/Footer'
import { CheckSquare, Square } from 'lucide-react'

export default function BookServicePage() {
  const router = useRouter()
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    bikeModel: '', bikeYear: '', registrationNumber: '', vin: '', mileage: '',
    preferredDate: '', preferredTime: '', description: '', customService: '',
  })

  const showCustom = selectedServices.includes('OTHER')
  const toggleService = (value: string) => {
    setSelectedServices((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (selectedServices.length === 0) { setError('Please select at least one service'); return }
    if (!form.bikeModel || !form.preferredDate || !form.preferredTime) { setError('Please fill in all required fields'); return }

    setSubmitting(true)
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bikeModel: form.bikeModel,
        bikeYear: form.bikeYear ? Number(form.bikeYear) : null,
        registrationNumber: form.registrationNumber || null,
        vin: form.vin || null,
        mileage: form.mileage ? Number(form.mileage) : null,
        services: selectedServices,
        customService: showCustom ? form.customService : null,
        description: form.description || null,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
      }),
    })
    setSubmitting(false)

    if (res.ok) {
      router.push('/my-appointments')
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to book appointment')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-zinc-900 mb-8">Book a Service Appointment</h1>
          {error && <p className="text-[#E60012] text-sm mb-4">{error}</p>}

          <form onSubmit={onSubmit} className="space-y-8">
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-5">Bike Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Label>Bike Model *</Label><Input value={form.bikeModel} onChange={(e) => setForm({ ...form, bikeModel: e.target.value })} placeholder="e.g. Gixxer SF 250" className="mt-1 rounded-xl" required /></div>
                <div><Label>Bike Year</Label><Input type="number" value={form.bikeYear} onChange={(e) => setForm({ ...form, bikeYear: e.target.value })} className="mt-1 rounded-xl" /></div>
                <div><Label>Current Mileage (km)</Label><Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="mt-1 rounded-xl" /></div>
                <div><Label>Registration Number</Label><Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="mt-1 rounded-xl" /></div>
                <div><Label>VIN (optional)</Label><Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="mt-1 rounded-xl" /></div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-2">Select Services *</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_TYPES.map(({ value, label }) => {
                  const active = selectedServices.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleService(value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${active ? 'border-[#E60012] bg-[#E60012]/5 text-[#E60012]' : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'}`}
                    >
                      {active ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0 text-zinc-400" />}
                      {label}
                    </button>
                  )
                })}
              </div>
              {showCustom && (
                <div className="mt-4"><Label>Describe the other service</Label><Input value={form.customService} onChange={(e) => setForm({ ...form, customService: e.target.value })} className="mt-1 rounded-xl" /></div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-5">Schedule</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Preferred Date *</Label><Input type="date" min={today} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="mt-1 rounded-xl" required /></div>
                <div>
                  <Label>Preferred Time *</Label>
                  <select value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white" required>
                    <option value="">Select a time slot</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-4">Issue Description</h2>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" />
            </section>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl px-8">{submitting ? 'Booking...' : 'Book Appointment'}</Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 5: Write `web/app/(site)/my-appointments/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { STATUS_CONFIG, getServiceLabel, TIME_SLOTS } from '@/lib/appointmentConstants'
import type { AppointmentDto } from '@/lib/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import { Plus, Wrench, CalendarDays, Clock, Eye, XCircle, RefreshCw, X } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
}

function RescheduleModal({ appt, onClose, onSuccess }: { appt: AppointmentDto; onClose: () => void; onSuccess: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(appt.preferredDate.toString().slice(0, 10))
  const [time, setTime] = useState(appt.preferredTime)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/appointments/${appt.id}/reschedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bikeModel: appt.bikeModel, preferredDate: date, preferredTime: time }),
    })
    setSaving(false)
    if (res.ok) { onSuccess() } else { const body = await res.json().catch(() => ({})); setError(body.message ?? 'Failed to reschedule') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="font-bold text-zinc-900 text-lg">Reschedule Appointment</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div><Label htmlFor="rs-date">New Date</Label><Input id="rs-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded-xl" required /></div>
          <div>
            <Label htmlFor="rs-time">New Time Slot</Label>
            <select id="rs-time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white" required>
              <option value="">Select a time slot</option>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving} className="flex-1 bg-[#E60012] hover:bg-[#C5000F] rounded-xl">{saving ? 'Saving...' : 'Confirm Reschedule'}</Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MyAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<AppointmentDto | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentDto | null>(null)

  const fetchAppointments = async () => {
    setLoading(true)
    const res = await fetch('/api/appointments/my')
    setAppointments(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchAppointments() }, [])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    await fetch(`/api/appointments/${cancelTarget.id}/cancel`, { method: 'PUT' })
    setCancelling(false)
    setCancelTarget(null)
    fetchAppointments()
  }

  return (
    <>
      {rescheduleTarget && (
        <RescheduleModal appt={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onSuccess={() => { setRescheduleTarget(null); fetchAppointments() }} />
      )}

      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">My Service Appointments</h1>
            <Button onClick={() => router.push('/book-service')} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl"><Plus className="w-4 h-4 mr-2" /> Book Service</Button>
          </div>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading appointments..." />
          ) : appointments.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Wrench className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium">No appointments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2"><StatusBadge status={appt.status} /><span className="text-xs text-zinc-400">#{appt.id}</span></div>
                      <h3 className="font-bold text-zinc-900 text-lg">{appt.bikeModel}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {appt.services.slice(0, 3).map((s) => <span key={s} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">{getServiceLabel(s)}</span>)}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {appt.preferredDate.toString().slice(0, 10)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {appt.preferredTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link href={`/appointments/${appt.id}`}><Button size="sm" variant="outline" className="rounded-xl"><Eye className="w-4 h-4 mr-1" /> View</Button></Link>
                      {appt.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="outline" className="rounded-xl text-blue-600 border-blue-200" onClick={() => setRescheduleTarget(appt)}><RefreshCw className="w-4 h-4 mr-1" /> Reschedule</Button>
                          <Button size="sm" variant="outline" className="rounded-xl text-red-600 border-red-200" onClick={() => setCancelTarget(appt)}><XCircle className="w-4 h-4 mr-1" /> Cancel</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)} title="Cancel Appointment" itemName={`${cancelTarget?.bikeModel}`} onConfirm={handleCancel} loading={cancelling} />
      <Footer />
    </>
  )
}
```

- [ ] **Step 6: Write `web/app/(site)/appointments/[id]/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { STATUS_CONFIG, getServiceLabel, TIME_SLOTS } from '@/lib/appointmentConstants'
import type { AppointmentDto } from '@/lib/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/LoadingSpinner'
import Footer from '@/components/Footer'

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
}

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'

  const [appt, setAppt] = useState<AppointmentDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusForm, setStatusForm] = useState({ status: '', mechanicName: '', estimatedCost: '', finalCost: '', serviceNotes: '', repairNotes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AppointmentDto | null) => {
        setAppt(data)
        if (data) {
          setStatusForm({
            status: data.status, mechanicName: data.mechanicName ?? '',
            estimatedCost: data.estimatedCost?.toString() ?? '', finalCost: data.finalCost?.toString() ?? '',
            serviceNotes: data.serviceNotes ?? '', repairNotes: data.repairNotes ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: statusForm.status,
        mechanicName: statusForm.mechanicName || null,
        estimatedCost: statusForm.estimatedCost ? Number(statusForm.estimatedCost) : null,
        finalCost: statusForm.finalCost ? Number(statusForm.finalCost) : null,
        serviceNotes: statusForm.serviceNotes || null,
        repairNotes: statusForm.repairNotes || null,
      }),
    })
    setSaving(false)
    if (res.ok) setAppt(await res.json())
  }

  if (loading) return <LoadingSpinner className="min-h-[60vh]" label="Loading..." />
  if (!appt) return <div className="py-24 text-center text-zinc-500">Appointment not found.</div>

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-6">← Back</button>
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-zinc-900">Appointment #{appt.id}</h1>
            <StatusBadge status={appt.status} />
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Bike Details</h2>
            <p className="text-sm text-zinc-700">Model: {appt.bikeModel}</p>
            {appt.bikeYear && <p className="text-sm text-zinc-700">Year: {appt.bikeYear}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Services Requested</h2>
            <div className="flex flex-wrap gap-2">
              {appt.services.map((s) => <span key={s} className="bg-[#E60012]/10 text-[#E60012] text-sm font-medium px-3 py-1 rounded-full">{getServiceLabel(s)}</span>)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Schedule</h2>
            <p className="text-sm text-zinc-700">Date: {appt.preferredDate.toString().slice(0, 10)}</p>
            <p className="text-sm text-zinc-700">Time: {appt.preferredTime}</p>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
              <h2 className="font-semibold text-zinc-900 mb-5">Update Appointment (Admin)</h2>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <select value={statusForm.status} onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))} className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white">
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
                  </select>
                </div>
                <div><Label>Assign Mechanic</Label><Input value={statusForm.mechanicName} onChange={(e) => setStatusForm((p) => ({ ...p, mechanicName: e.target.value }))} className="mt-1 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Estimated Cost (Rs)</Label><Input type="number" value={statusForm.estimatedCost} onChange={(e) => setStatusForm((p) => ({ ...p, estimatedCost: e.target.value }))} className="mt-1 rounded-xl" /></div>
                  <div><Label>Final Cost (Rs)</Label><Input type="number" value={statusForm.finalCost} onChange={(e) => setStatusForm((p) => ({ ...p, finalCost: e.target.value }))} className="mt-1 rounded-xl" /></div>
                </div>
                <div><Label>Service Notes</Label><textarea value={statusForm.serviceNotes} onChange={(e) => setStatusForm((p) => ({ ...p, serviceNotes: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" /></div>
                <div><Label>Repair Notes</Label><textarea value={statusForm.repairNotes} onChange={(e) => setStatusForm((p) => ({ ...p, repairNotes: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" /></div>
                <Button type="submit" disabled={saving} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">{saving ? 'Saving...' : 'Save Changes'}</Button>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 7: Write `web/app/(site)/admin/appointments/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { STATUS_CONFIG, getServiceLabel } from '@/lib/appointmentConstants'
import type { AppointmentDto } from '@/lib/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import { Search, Eye, Trash2, RefreshCw } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
}

const STATUSES = ['', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

interface Stats { todayCount: number; pendingCount: number; inProgressCount: number; completedCount: number; monthlyRevenue: number }

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AppointmentDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filters, setFilters] = useState({ status: '', date: '', client: '', bikeModel: '' })

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.date) params.set('date', filters.date)
    if (filters.client.trim()) params.set('client', filters.client.trim())
    if (filters.bikeModel.trim()) params.set('bikeModel', filters.bikeModel.trim())

    const [apptsRes, statsRes] = await Promise.all([
      fetch(`/api/appointments?${params}`),
      fetch('/api/appointments/stats'),
    ])
    setAppointments(apptsRes.ok ? await apptsRes.json() : [])
    setStats(statsRes.ok ? await statsRes.json() : null)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/appointments/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    fetchData()
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Service Appointments</h1>
            <Button variant="outline" className="rounded-xl gap-2" onClick={fetchData}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5"><p className="text-zinc-500 text-sm">Today</p><p className="text-3xl font-bold mt-1 text-blue-600">{stats.todayCount}</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5"><p className="text-zinc-500 text-sm">Pending</p><p className="text-3xl font-bold mt-1 text-yellow-600">{stats.pendingCount}</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5"><p className="text-zinc-500 text-sm">In Progress</p><p className="text-3xl font-bold mt-1 text-purple-600">{stats.inProgressCount}</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5"><p className="text-zinc-500 text-sm">Completed</p><p className="text-3xl font-bold mt-1 text-green-600">{stats.completedCount}</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5"><p className="text-zinc-500 text-sm">Monthly Revenue</p><p className="text-3xl font-bold mt-1 text-[#E60012]">Rs. {stats.monthlyRevenue.toLocaleString()}</p></div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white">
                {STATUSES.map((s) => <option key={s} value={s}>{s ? (STATUS_CONFIG[s]?.label ?? s) : 'All Statuses'}</option>)}
              </select>
              <Input type="date" value={filters.date} onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))} className="rounded-xl" />
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><Input placeholder="Search client..." value={filters.client} onChange={(e) => setFilters((p) => ({ ...p, client: e.target.value }))} className="pl-9 rounded-xl" /></div>
              <div className="flex gap-2"><Input placeholder="Bike model..." value={filters.bikeModel} onChange={(e) => setFilters((p) => ({ ...p, bikeModel: e.target.value }))} className="rounded-xl" /><Button onClick={fetchData} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl shrink-0">Search</Button></div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner className="py-20" label="Loading..." />
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200"><p className="text-zinc-500 font-medium">No appointments found</p></div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>{['#', 'Client', 'Bike', 'Services', 'Date', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{appt.id}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">{appt.clientUsername}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{appt.bikeModel}</td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-1 max-w-[180px]">{appt.services.slice(0, 2).map((s) => <span key={s} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full whitespace-nowrap">{getServiceLabel(s)}</span>)}</div></td>
                      <td className="px-4 py-3 whitespace-nowrap">{appt.preferredDate.toString().slice(0, 10)}</td>
                      <td className="px-4 py-3"><StatusBadge status={appt.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/appointments/${appt.id}`}><Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0"><Eye className="w-3.5 h-3.5" /></Button></Link>
                          <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0 text-red-500 border-red-200" onClick={() => setDeleteTarget(appt)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Appointment" itemName={`${deleteTarget?.clientUsername} – ${deleteTarget?.bikeModel}`} onConfirm={handleDelete} loading={deleting} />
      <Footer />
    </>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add book-service, my-appointments, appointment detail, admin appointments pages"
```

---

### Task 19: Contact + test-drive forms

**Files:**
- Create: `web/lib/validations/contact.ts`
- Create: `web/lib/validations/testDrive.ts`
- Create: `web/app/api/contact/route.ts`
- Create: `web/app/api/test-drive/route.ts`
- Create: `web/app/(site)/contact/page.tsx`
- Create: `web/app/(site)/test-drive/page.tsx`
- Test: `web/tests/api/contact-testdrive.test.ts`

**Interfaces:**
- Consumes: `prisma`, `handleApiError` (Tasks 1/3), `Button`/`Input`/`Label`/`Textarea` (Task 2), `Footer` (Task 6).
- Produces: `POST /api/contact` (public, body `{ name, email, phone?, subject?, message }` → 201), `POST /api/test-drive` (public, body `{ name, phone, email?, vehicleId?, preferredDate?, message? }` → 201). Pages: `/contact`, `/test-drive`.

- [ ] **Step 1: Write `web/lib/validations/contact.ts`**

```typescript
import { z } from 'zod'

export const contactInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(100),
  phone: z.string().max(20).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(1, 'Message is required').max(2000),
})

export type ContactInput = z.infer<typeof contactInputSchema>
```

- [ ] **Step 2: Write `web/lib/validations/testDrive.ts`**

```typescript
import { z } from 'zod'

export const testDriveInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().max(100).optional().nullable(),
  vehicleId: z.number().int().positive().optional().nullable(),
  preferredDate: z.string().optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
})

export type TestDriveInput = z.infer<typeof testDriveInputSchema>
```

- [ ] **Step 3: Write the failing test**

`web/tests/api/contact-testdrive.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contactRequest: { create: vi.fn() },
    testDriveRequest: { create: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { POST as CONTACT } from '@/app/api/contact/route'
import { POST as TEST_DRIVE } from '@/app/api/test-drive/route'

describe('POST /api/contact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a contact request and returns 201', async () => {
    ;(prisma.contactRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 })
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@example.com', message: 'Hello, I have a question.' }),
    })
    const res = await CONTACT(req as never)
    expect(res.status).toBe(201)
  })

  it('rejects an invalid email with 400', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'not-an-email', message: 'Hello' }),
    })
    const res = await CONTACT(req as never)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/test-drive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a test drive request and returns 201', async () => {
    ;(prisma.testDriveRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 })
    const req = new Request('http://localhost/api/test-drive', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', phone: '9800000000' }),
    })
    const res = await TEST_DRIVE(req as never)
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 4: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/contact-testdrive.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 5: Write `web/app/api/contact/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { contactInputSchema } from '@/lib/validations/contact'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = contactInputSchema.parse(body)
    const contact = await prisma.contactRequest.create({ data })
    return NextResponse.json({ id: contact.id, message: 'Contact form submitted successfully' }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 6: Write `web/app/api/test-drive/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { testDriveInputSchema } from '@/lib/validations/testDrive'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = testDriveInputSchema.parse(body)
    const request = await prisma.testDriveRequest.create({
      data: { ...data, preferredDate: data.preferredDate ? new Date(data.preferredDate) : null },
    })
    return NextResponse.json({ id: request.id, message: 'Test drive request submitted successfully' }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 7: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/contact-testdrive.test.ts`
Expected: 3 passed

- [ ] **Step 8: Write `web/app/(site)/contact/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, phone: form.phone || null, subject: form.subject || null }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSent(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to send message')
    }
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Contact Us</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><Phone className="w-6 h-6 text-[#E60012] mb-3" /><h3 className="font-semibold text-zinc-900 mb-1">Phone</h3><p className="text-zinc-600">+977-1-XXXXXXX</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><Mail className="w-6 h-6 text-[#E60012] mb-3" /><h3 className="font-semibold text-zinc-900 mb-1">Email</h3><p className="text-zinc-600">info@suzukimotorcycle.com.np</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><MapPin className="w-6 h-6 text-[#E60012] mb-3" /><h3 className="font-semibold text-zinc-900 mb-1">Address</h3><p className="text-zinc-600">Balkumari, Lalitpur, Nepal</p></div>
            </div>
            <div className="lg:col-span-2">
              {sent ? (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm text-center">
                  <p className="text-zinc-700 font-medium">Message sent! We will get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div><Label htmlFor="name">Full Name *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
                  <div><Label htmlFor="subject">Subject *</Label><Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="message">Message *</Label><Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} required className="mt-1" /></div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#E60012] hover:bg-[#C5000F]">{submitting ? 'Sending...' : 'Send Message'}</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 9: Write `web/app/(site)/test-drive/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TestDrivePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', preferredDate: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/test-drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, email: form.email || null, preferredDate: form.preferredDate || null, message: form.message || null }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSent(true)
      setForm({ name: '', email: '', phone: '', preferredDate: '', message: '' })
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to submit booking request')
    }
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Book a Test Drive</h1>
          <p className="text-zinc-600 mb-8">Experience the thrill of riding a Suzuki motorcycle or scooter.</p>

          {sent ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm text-center">
              <p className="text-zinc-700 font-medium">Test drive booking request submitted! We will contact you soon.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div><Label htmlFor="name">Full Name *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" /></div>
              <div><Label htmlFor="phone">Phone Number *</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="mt-1" /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label htmlFor="preferredDate">Preferred Date</Label><Input id="preferredDate" type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="mt-1" /></div>
              <div><Label htmlFor="message">Additional Message</Label><Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="mt-1" /></div>
              <Button type="submit" disabled={submitting} className="w-full bg-[#E60012] hover:bg-[#C5000F]">{submitting ? 'Submitting...' : 'Submit Booking Request'}</Button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add contact and test-drive forms"
```

---

### Task 20: Analytics API + admin page

**Files:**
- Create: `web/app/api/analytics/summary/route.ts`
- Create: `web/app/(site)/admin/analytics/page.tsx`
- Test: `web/tests/api/analytics.test.ts`

**Interfaces:**
- Consumes: `prisma`, `requireAdmin`, `handleApiError` (Tasks 1/3/5), `formatNPR` (Task 1), `Footer`, `Button` (Task 6/2).
- Produces: `GET /api/analytics/summary?from=&to=` (admin, dates default to last 30 days) → `{ totalRevenue, totalOrders, avgOrderValue, topParts: [{partName, qtySold, revenue}], ordersByDay: [{date, count, revenue}], lowStockParts: [{partName, quantity}] }`. Page: `/admin/analytics`.

- [ ] **Step 1: Install recharts**

```bash
cd web
npm install recharts
```

- [ ] **Step 2: Write the failing test**

`web/tests/api/analytics.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { order: { findMany: vi.fn() }, part: { findMany: vi.fn() } },
}))

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/analytics/summary/route'

describe('GET /api/analytics/summary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue({ status: 403, message: 'Admin access required' })
    const req = new Request('http://localhost/api/analytics/summary')
    const res = await GET(req as never)
    expect(res.status).toBe(403)
  })

  it('computes totals and top parts from PAID orders in range', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    ;(prisma.order.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, totalAmount: 1000, createdAt: new Date('2026-07-10'), items: [{ partName: 'Air Filter', price: 500, quantity: 2 }] },
      { id: 2, totalAmount: 500, createdAt: new Date('2026-07-11'), items: [{ partName: 'Air Filter', price: 500, quantity: 1 }] },
    ])
    ;(prisma.part.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ partName: 'Brake Pad', quantity: 3 }])

    const req = new Request('http://localhost/api/analytics/summary?from=2026-07-01&to=2026-07-15')
    const res = await GET(req as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalRevenue).toBe(1500)
    expect(body.totalOrders).toBe(2)
    expect(body.avgOrderValue).toBe(750)
    expect(body.topParts[0]).toEqual({ partName: 'Air Filter', qtySold: 3, revenue: 1500 })
    expect(body.lowStockParts).toEqual([{ partName: 'Brake Pad', quantity: 3 }])
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/analytics.test.ts`
Expected: FAIL (route file doesn't exist)

- [ ] **Step 4: Write `web/app/api/analytics/summary/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const toParam = searchParams.get('to')
    const fromParam = searchParams.get('from')
    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
    const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000)

    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID', createdAt: { gte: from, lt: toExclusive } },
      include: { items: true },
    })

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalOrders = paidOrders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const partTotals = new Map<string, { qtySold: number; revenue: number }>()
    for (const order of paidOrders) {
      for (const item of order.items) {
        const existing = partTotals.get(item.partName) ?? { qtySold: 0, revenue: 0 }
        existing.qtySold += item.quantity
        existing.revenue += item.price * item.quantity
        partTotals.set(item.partName, existing)
      }
    }
    const topParts = [...partTotals.entries()]
      .map(([partName, v]) => ({ partName, qtySold: v.qtySold, revenue: v.revenue }))
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 10)

    const dayMap = new Map<string, { count: number; revenue: number }>()
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      dayMap.set(d.toISOString().slice(0, 10), { count: 0, revenue: 0 })
    }
    for (const order of paidOrders) {
      const key = order.createdAt.toISOString().slice(0, 10)
      const existing = dayMap.get(key)
      if (existing) {
        existing.count += 1
        existing.revenue += order.totalAmount
      }
    }
    const ordersByDay = [...dayMap.entries()].map(([date, v]) => ({ date, count: v.count, revenue: v.revenue }))

    const lowStockPartsRaw = await prisma.part.findMany({ where: { brand: 'Suzuki', quantity: { lte: 5 } } })
    const lowStockParts = lowStockPartsRaw.map((p) => ({ partName: p.partName, quantity: p.quantity }))

    return NextResponse.json({ totalRevenue, totalOrders, avgOrderValue, topParts, ordersByDay, lowStockParts })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/analytics.test.ts`
Expected: 2 passed

- [ ] **Step 6: Write `web/app/(site)/admin/analytics/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { formatNPR } from '@/lib/currency'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsSummary {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  topParts: { partName: string; qtySold: number; revenue: number }[]
  ordersByDay: { date: string; count: number; revenue: number }[]
  lowStockParts: { partName: string; quantity: number }[]
}

const RANGE_OPTIONS = [{ label: 'Last 7 days', days: 7 }, { label: 'Last 30 days', days: 30 }, { label: 'Last 90 days', days: 90 }]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => {
    setLoading(true)
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - range)
    const params = new URLSearchParams({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] })
    fetch(`/api/analytics/summary?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }, [range])

  if (loading && !data) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8"><div className="max-w-7xl mx-auto animate-pulse space-y-6"><div className="h-10 bg-zinc-200 rounded w-48" /><div className="h-80 bg-zinc-200 rounded-2xl" /></div></div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Sales Analytics</h1>
            <div className="flex gap-2">
              {RANGE_OPTIONS.map((opt) => (
                <Button key={opt.days} variant={range === opt.days ? 'default' : 'outline'} size="sm" className={range === opt.days ? 'bg-[#E60012] hover:bg-[#C5000F]' : ''} onClick={() => setRange(opt.days)}>{opt.label}</Button>
              ))}
            </div>
          </div>

          {data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><p className="text-sm text-zinc-600 mb-1">Total Revenue</p><p className="text-2xl font-bold text-[#E60012]">{formatNPR(data.totalRevenue)}</p></div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><p className="text-sm text-zinc-600 mb-1">Total Orders</p><p className="text-2xl font-bold text-zinc-900">{data.totalOrders}</p></div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><p className="text-sm text-zinc-600 mb-1">Avg Order Value</p><p className="text-2xl font-bold text-zinc-900">{formatNPR(data.avgOrderValue)}</p></div>
              </div>

              {data.ordersByDay.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-8">
                  <h3 className="font-semibold text-zinc-900 mb-4">Revenue by Day</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.ordersByDay}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#E60012" strokeWidth={2} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.topParts.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-8">
                  <h3 className="font-semibold text-zinc-900 mb-4">Top Selling Parts</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-zinc-200"><th className="text-left py-3 px-2 font-semibold text-zinc-600">Part</th><th className="text-right py-3 px-2 font-semibold text-zinc-600">Qty Sold</th><th className="text-right py-3 px-2 font-semibold text-zinc-600">Revenue</th></tr></thead>
                    <tbody>{data.topParts.map((p, i) => <tr key={i} className="border-b border-zinc-100"><td className="py-3 px-2">{p.partName}</td><td className="py-3 px-2 text-right">{p.qtySold}</td><td className="py-3 px-2 text-right font-semibold">{formatNPR(p.revenue)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}

              {data.lowStockParts.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-zinc-900 mb-4">Low Stock Parts</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-zinc-200"><th className="text-left py-3 px-2 font-semibold text-zinc-600">Part</th><th className="text-right py-3 px-2 font-semibold text-zinc-600">Quantity</th></tr></thead>
                    <tbody>{data.lowStockParts.map((p, i) => <tr key={i} className="border-b border-zinc-100"><td className="py-3 px-2">{p.partName}</td><td className="py-3 px-2 text-right"><span className={p.quantity <= 5 ? 'text-red-600 font-semibold' : ''}>{p.quantity}</span></td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add analytics API and admin analytics page"
```

---

### Task 21: Admin users API + page

**Files:**
- Create: `web/lib/validations/adminUser.ts`
- Create: `web/lib/adminUsers.ts`
- Create: `web/app/api/admin/users/route.ts`
- Create: `web/app/api/admin/users/[id]/route.ts`
- Create: `web/app/api/admin/users/[id]/role/route.ts`
- Create: `web/app/api/admin/users/[id]/enable/route.ts`
- Create: `web/app/(site)/admin/users/page.tsx`
- Test: `web/tests/api/admin-users.test.ts`

**Design note:** the original app stored `enabled` as a local DB boolean gating login. Since Clerk now owns account state, this task sources the admin user list directly from Clerk's Backend API (`clerkClient().users`) rather than the local `User` mirror table — the mirror table is only used for `Order`/`Appointment` foreign keys, not for this admin page. "Disable" maps to Clerk's `banUser`, "Enable" to `unbanUser`. Role updates go through `updateUserMetadata`, which (via the Task 5 webhook) keeps the local mirror in sync.

**Interfaces:**
- Consumes: `requireAdmin` (Task 5), `handleApiError` (Task 1), `DataTable`/`Badge`/`Button`/`Input`/`Dialog*` (Task 2/8).
- Produces: `AdminUserDto = { id: string; username: string | null; email: string; phoneNumber: string | null; role: 'ADMIN' | 'CLIENT'; enabled: boolean; createdAt: string }` and `toAdminUserDto(clerkUser): AdminUserDto` from `lib/adminUsers.ts`. Routes: `GET /api/admin/users` (list), `GET /api/admin/users/:id`, `PUT /api/admin/users/:id/role` (body `{ role }`), `PUT /api/admin/users/:id/enable` (body `{ enabled }`) — all admin-only, `:id` is the Clerk user id (a string, not the numeric local `User.id`). Page: `/admin/users`.

- [ ] **Step 1: Write `web/lib/validations/adminUser.ts`**

```typescript
import { z } from 'zod'

export const roleUpdateSchema = z.object({ role: z.enum(['ADMIN', 'CLIENT']) })
export const enabledUpdateSchema = z.object({ enabled: z.boolean() })
```

- [ ] **Step 2: Write `web/lib/adminUsers.ts`**

```typescript
export interface AdminUserDto {
  id: string
  username: string | null
  email: string
  phoneNumber: string | null
  role: 'ADMIN' | 'CLIENT'
  enabled: boolean
  createdAt: string
}

interface ClerkUserLike {
  id: string
  username: string | null
  emailAddresses: { id: string; emailAddress: string }[]
  primaryEmailAddressId: string | null
  phoneNumbers: { id: string; phoneNumber: string }[]
  primaryPhoneNumberId: string | null
  publicMetadata: { role?: string }
  banned: boolean
  createdAt: number
}

export function toAdminUserDto(user: ClerkUserLike): AdminUserDto {
  const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
    ?? user.emailAddresses[0]?.emailAddress ?? ''
  const phoneNumber = user.phoneNumbers.find((p) => p.id === user.primaryPhoneNumberId)?.phoneNumber ?? null
  const role: 'ADMIN' | 'CLIENT' = user.publicMetadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'

  return {
    id: user.id,
    username: user.username,
    email,
    phoneNumber,
    role,
    enabled: !user.banned,
    createdAt: new Date(user.createdAt).toISOString(),
  }
}
```

- [ ] **Step 3: Write the failing test**

`web/tests/api/admin-users.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const requireAdminMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdminMock() }))

const getUserListMock = vi.fn()
const updateUserMetadataMock = vi.fn()
const banUserMock = vi.fn()
const unbanUserMock = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({
    users: {
      getUserList: (...args: unknown[]) => getUserListMock(...args),
      updateUserMetadata: (...args: unknown[]) => updateUserMetadataMock(...args),
      banUser: (...args: unknown[]) => banUserMock(...args),
      unbanUser: (...args: unknown[]) => unbanUserMock(...args),
    },
  }),
}))

const sampleClerkUser = {
  id: 'user_1', username: 'johndoe',
  emailAddresses: [{ id: 'e1', emailAddress: 'john@example.com' }], primaryEmailAddressId: 'e1',
  phoneNumbers: [], primaryPhoneNumberId: null,
  publicMetadata: { role: 'CLIENT' }, banned: false, createdAt: 1700000000000,
}

import { GET as LIST } from '@/app/api/admin/users/route'
import { PUT as UPDATE_ROLE } from '@/app/api/admin/users/[id]/role/route'
import { PUT as UPDATE_ENABLED } from '@/app/api/admin/users/[id]/enable/route'

describe('GET /api/admin/users', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockRejectedValue({ status: 403, message: 'Admin access required' })
    const res = await LIST()
    expect(res.status).toBe(403)
  })

  it('maps the Clerk user list to AdminUserDto', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    getUserListMock.mockResolvedValue({ data: [sampleClerkUser] })
    const res = await LIST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body[0]).toMatchObject({ id: 'user_1', email: 'john@example.com', role: 'CLIENT', enabled: true })
  })
})

describe('PUT /api/admin/users/[id]/role', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates Clerk publicMetadata.role', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    updateUserMetadataMock.mockResolvedValue({ ...sampleClerkUser, publicMetadata: { role: 'ADMIN' } })
    const req = new Request('http://localhost/api/admin/users/user_1/role', { method: 'PUT', body: JSON.stringify({ role: 'ADMIN' }) })
    const res = await UPDATE_ROLE(req as never, { params: Promise.resolve({ id: 'user_1' }) })
    expect(res.status).toBe(200)
    expect(updateUserMetadataMock).toHaveBeenCalledWith('user_1', { publicMetadata: { role: 'ADMIN' } })
  })
})

describe('PUT /api/admin/users/[id]/enable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls banUser when enabled=false', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    banUserMock.mockResolvedValue({ ...sampleClerkUser, banned: true })
    const req = new Request('http://localhost/api/admin/users/user_1/enable', { method: 'PUT', body: JSON.stringify({ enabled: false }) })
    const res = await UPDATE_ENABLED(req as never, { params: Promise.resolve({ id: 'user_1' }) })
    expect(res.status).toBe(200)
    expect(banUserMock).toHaveBeenCalledWith('user_1')
  })

  it('calls unbanUser when enabled=true', async () => {
    requireAdminMock.mockResolvedValue({ id: 1, role: 'ADMIN' })
    unbanUserMock.mockResolvedValue(sampleClerkUser)
    const req = new Request('http://localhost/api/admin/users/user_1/enable', { method: 'PUT', body: JSON.stringify({ enabled: true }) })
    const res = await UPDATE_ENABLED(req as never, { params: Promise.resolve({ id: 'user_1' }) })
    expect(res.status).toBe(200)
    expect(unbanUserMock).toHaveBeenCalledWith('user_1')
  })
})
```

- [ ] **Step 4: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/admin-users.test.ts`
Expected: FAIL (route files don't exist)

- [ ] **Step 5: Write `web/app/api/admin/users/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { toAdminUserDto } from '@/lib/adminUsers'

export async function GET() {
  try {
    await requireAdmin()
    const client = await clerkClient()
    const { data } = await client.users.getUserList({ limit: 200 })
    return NextResponse.json(data.map((u) => toAdminUserDto(u as never)))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 6: Write `web/app/api/admin/users/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { toAdminUserDto } from '@/lib/adminUsers'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const client = await clerkClient()
    const user = await client.users.getUser(id)
    return NextResponse.json(toAdminUserDto(user as never))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 7: Write `web/app/api/admin/users/[id]/role/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { roleUpdateSchema } from '@/lib/validations/adminUser'
import { toAdminUserDto } from '@/lib/adminUsers'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { role } = roleUpdateSchema.parse(body)
    const client = await clerkClient()
    const user = await client.users.updateUserMetadata(id, { publicMetadata: { role } })
    return NextResponse.json(toAdminUserDto(user as never))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 8: Write `web/app/api/admin/users/[id]/enable/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { enabledUpdateSchema } from '@/lib/validations/adminUser'
import { toAdminUserDto } from '@/lib/adminUsers'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { enabled } = enabledUpdateSchema.parse(body)
    const client = await clerkClient()
    const user = enabled ? await client.users.unbanUser(id) : await client.users.banUser(id)
    return NextResponse.json(toAdminUserDto(user as never))
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 9: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/admin-users.test.ts`
Expected: 5 passed

- [ ] **Step 10: Write `web/app/(site)/admin/users/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AdminUserDto } from '@/lib/adminUsers'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null)

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    setUsers(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.username?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phoneNumber ?? '').includes(search)
  })

  const handleRoleChange = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    if (res.ok) { const updated = await res.json(); setUsers((prev) => prev.map((u) => (u.id === id ? updated : u))) }
  }

  const handleEnabledChange = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/admin/users/${id}/enable`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) })
    if (res.ok) { const updated = await res.json(); setUsers((prev) => prev.map((u) => (u.id === id ? updated : u))) }
  }

  if (loading) return <div className="py-24 text-center text-zinc-500">Loading...</div>

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">User Management</h1>
          <Input placeholder="Search by username or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm mb-6" />

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Enabled</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="h-9 px-3 border border-zinc-200 rounded-lg text-sm">
                        <option value="ADMIN">ADMIN</option><option value="CLIENT">CLIENT</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.enabled ? 'default' : 'destructive'}>{user.enabled ? 'Yes' : 'No'}</Badge>
                      <Button variant="ghost" size="sm" className="ml-2" onClick={() => handleEnabledChange(user.id, !user.enabled)}>{user.enabled ? 'Disable' : 'Enable'}</Button>
                    </TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-2">
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phoneNumber || '-'}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Enabled:</strong> {selectedUser.enabled ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add admin users API (Clerk-backed) and admin users page"
```

---

### Task 22: Profile page + users/me API

**Files:**
- Create: `web/app/api/users/me/route.ts`
- Create: `web/app/(site)/profile/page.tsx`
- Test: `web/tests/api/users-me.test.ts`

**Design note:** Clerk now owns username/email/password/phone — editing them goes through Clerk's own `<UserProfile />` component (embedded here), not a custom form posting to our API. `PUT /api/users/me` from the original app is dropped: a separate write path to the local mirror would drift from Clerk, which is the source of truth. `GET /api/users/me` is read-only, reflecting the local mirror kept in sync by the Task 5 webhook — used to display role and join date, which Clerk's own UI doesn't show.

**Interfaces:**
- Consumes: `requireUser` (Task 5), `handleApiError` (Task 1), `Badge` (Task 2), `Footer` (Task 6).
- Produces: `GET /api/users/me` (auth) → `{ id, username, email, phoneNumber, role, createdAt }`. Page: `/profile`.

- [ ] **Step 1: Write the failing test**

`web/tests/api/users-me.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const requireUserMock = vi.fn()
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUserMock() }))

import { GET } from '@/app/api/users/me/route'

describe('GET /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires authentication', async () => {
    requireUserMock.mockRejectedValue({ status: 401, message: 'Not authenticated' })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the current user', async () => {
    requireUserMock.mockResolvedValue({ id: 1, username: 'john', email: 'john@example.com', phoneNumber: null, role: 'CLIENT', createdAt: new Date() })
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.username).toBe('john')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd web && npm test -- tests/api/users-me.test.ts`
Expected: FAIL (route file doesn't exist)

- [ ] **Step 3: Write `web/app/api/users/me/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const user = await requireUser()
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd web && npm test -- tests/api/users-me.test.ts`
Expected: 2 passed

- [ ] **Step 5: Write `web/app/(site)/profile/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@clerk/nextjs'
import Footer from '@/components/Footer'
import { Badge } from '@/components/ui/badge'

interface MeDto {
  id: number
  username: string
  email: string
  phoneNumber: string | null
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeDto | null>(null)

  useEffect(() => {
    fetch('/api/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
  }, [])

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Profile</h1>

          {me && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Account Information</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <p className="text-sm text-zinc-600 w-full">Phone: {me.phoneNumber || '-'}</p>
                <Badge variant="secondary">{me.role}</Badge>
                <span className="text-xs text-zinc-400">Joined {new Date(me.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <UserProfile
              routing="hash"
              appearance={{ elements: { rootBox: 'w-full', card: 'shadow-none border-0' } }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add profile page with users/me API and embedded Clerk UserProfile"
```

---

### Task 23: Email templates + Resend wiring

**Files:**
- Create: `web/emails/OrderConfirmationCustomer.tsx`
- Create: `web/emails/OrderAlertAdmin.tsx`
- Create: `web/emails/LowStockAlert.tsx`
- Create: `web/lib/email.ts`
- Modify: `web/lib/orders.ts` (Task 14 — wire email sends into `finalizeOrder`)
- Test: `web/tests/lib/email.test.ts`

**Interfaces:**
- Consumes: `Order`, `OrderItem`, `Part` (Prisma types, Task 3).
- Produces: `sendOrderConfirmationEmail(order)`, `sendOrderAlertAdminEmail(order)`, `sendLowStockAlertEmail(part)` from `lib/email.ts` — all no-ops when `MAIL_ENABLED !== 'true'` or (for the customer email) when the order has no email.

- [ ] **Step 1: Install Resend and react-email**

```bash
cd web
npm install resend @react-email/components
```

- [ ] **Step 2: Write `web/emails/OrderConfirmationCustomer.tsx`**

```typescript
import { Html, Head, Body, Container, Heading, Text, Section, Row, Column } from '@react-email/components'

interface OrderConfirmationCustomerProps {
  orderId: number
  customerName: string
  phone: string
  address: string
  items: { partName: string; price: number; quantity: number }[]
  totalAmount: number
}

export default function OrderConfirmationCustomer({ orderId, customerName, phone, address, items, totalAmount }: OrderConfirmationCustomerProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading style={{ color: '#E60012' }}>Suzuki Motorcycle Nepal</Heading>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Order Confirmation</Text>
          <Text>Thank you for your order!</Text>
          <Text>Order #{orderId}</Text>
          <Text>Customer: {customerName}</Text>
          <Text>Phone: {phone}</Text>
          <Text>Address: {address}</Text>
          <Section>
            {items.map((item, i) => (
              <Row key={i}>
                <Column>{item.partName}</Column>
                <Column>x{item.quantity}</Column>
                <Column>Rs {(item.price * item.quantity).toLocaleString()}</Column>
              </Row>
            ))}
          </Section>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total: Rs {totalAmount.toLocaleString()}</Text>
          <Text>Your payment has been confirmed. We will process your order shortly.</Text>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 3: Write `web/emails/OrderAlertAdmin.tsx`**

```typescript
import { Html, Head, Body, Container, Heading, Text, Section, Row, Column } from '@react-email/components'

interface OrderAlertAdminProps {
  orderId: number
  customerName: string
  phone: string
  email: string | null
  address: string
  items: { partName: string; price: number; quantity: number }[]
  totalAmount: number
}

export default function OrderAlertAdmin({ orderId, customerName, phone, email, address, items, totalAmount }: OrderAlertAdminProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading style={{ color: '#E60012' }}>New Paid Order Received</Heading>
          <Text>Order #{orderId}</Text>
          <Text>Customer: {customerName}</Text>
          <Text>Phone: {phone}</Text>
          {email && <Text>Email: {email}</Text>}
          <Text>Address: {address}</Text>
          <Section>
            {items.map((item, i) => (
              <Row key={i}>
                <Column>{item.partName}</Column>
                <Column>x{item.quantity}</Column>
                <Column>Rs {(item.price * item.quantity).toLocaleString()}</Column>
              </Row>
            ))}
          </Section>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total: Rs {totalAmount.toLocaleString()}</Text>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 4: Write `web/emails/LowStockAlert.tsx`**

```typescript
import { Html, Head, Body, Container, Heading, Text, Section } from '@react-email/components'

interface LowStockAlertProps {
  partName: string
  compatibleModel: string | null
  quantity: number
}

export default function LowStockAlert({ partName, compatibleModel, quantity }: LowStockAlertProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading style={{ color: '#E60012' }}>Low Stock Alert</Heading>
          <Section style={{ background: '#fff3cd', padding: 15, borderRadius: 5 }}>
            <Text><strong>Part:</strong> {partName}</Text>
            <Text><strong>Compatible Model:</strong> {compatibleModel ?? 'N/A'}</Text>
            <Text><strong>Current Quantity:</strong> {quantity}</Text>
            <Text>Please restock this part as soon as possible.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 5: Write the failing test**

`web/tests/lib/email.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn()
vi.mock('resend', () => ({ Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })) }))

import { sendOrderConfirmationEmail, sendOrderAlertAdminEmail, sendLowStockAlertEmail } from '@/lib/email'
import type { Order, OrderItem, Part } from '@prisma/client'

const order = {
  id: 1, customerName: 'John', phone: '9800000000', email: 'john@example.com', address: 'Kathmandu',
  totalAmount: 1700, items: [{ id: 1, partId: 10, partName: 'Air Filter', price: 850, quantity: 2, orderId: 1 }],
} as Order & { items: OrderItem[] }

const part = { id: 10, partName: 'Air Filter', compatibleModel: null, quantity: 3 } as Part

describe('email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MAIL_ENABLED = 'true'
    process.env.MAIL_FROM = 'noreply@example.com'
    process.env.ADMIN_EMAIL = 'admin@example.com'
  })

  it('sends the customer confirmation email when MAIL_ENABLED and the order has an email', async () => {
    await sendOrderConfirmationEmail(order)
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'john@example.com', subject: 'Order Confirmation #1' }))
  })

  it('does not send the customer email when the order has no email', async () => {
    await sendOrderConfirmationEmail({ ...order, email: null })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('does not send anything when MAIL_ENABLED is false', async () => {
    process.env.MAIL_ENABLED = 'false'
    await sendOrderConfirmationEmail(order)
    await sendOrderAlertAdminEmail(order)
    await sendLowStockAlertEmail(part)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends the admin order alert to ADMIN_EMAIL', async () => {
    await sendOrderAlertAdminEmail(order)
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com', subject: 'New Paid Order #1' }))
  })

  it('sends the low stock alert to ADMIN_EMAIL', async () => {
    await sendLowStockAlertEmail(part)
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com', subject: 'Low Stock Alert: Air Filter' }))
  })
})
```

- [ ] **Step 6: Run test, verify it fails**

Run: `cd web && npm test -- tests/lib/email.test.ts`
Expected: FAIL (`lib/email.ts` doesn't exist)

- [ ] **Step 7: Write `web/lib/email.ts`**

```typescript
import { Resend } from 'resend'
import OrderConfirmationCustomer from '@/emails/OrderConfirmationCustomer'
import OrderAlertAdmin from '@/emails/OrderAlertAdmin'
import LowStockAlert from '@/emails/LowStockAlert'
import type { Order, OrderItem, Part } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

function mailEnabled(): boolean {
  return process.env.MAIL_ENABLED === 'true'
}

function mailFrom(): string {
  return process.env.MAIL_FROM ?? 'noreply@example.com'
}

function adminEmail(): string {
  return process.env.ADMIN_EMAIL ?? 'admin@example.com'
}

export async function sendOrderConfirmationEmail(order: Order & { items: OrderItem[] }): Promise<void> {
  if (!mailEnabled() || !order.email) return
  await resend.emails.send({
    from: mailFrom(),
    to: order.email,
    subject: `Order Confirmation #${order.id}`,
    react: OrderConfirmationCustomer({
      orderId: order.id,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      items: order.items.map((i) => ({ partName: i.partName, price: i.price, quantity: i.quantity })),
      totalAmount: order.totalAmount,
    }),
  })
}

export async function sendOrderAlertAdminEmail(order: Order & { items: OrderItem[] }): Promise<void> {
  if (!mailEnabled()) return
  await resend.emails.send({
    from: mailFrom(),
    to: adminEmail(),
    subject: `New Paid Order #${order.id}`,
    react: OrderAlertAdmin({
      orderId: order.id,
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      address: order.address,
      items: order.items.map((i) => ({ partName: i.partName, price: i.price, quantity: i.quantity })),
      totalAmount: order.totalAmount,
    }),
  })
}

export async function sendLowStockAlertEmail(part: Part): Promise<void> {
  if (!mailEnabled()) return
  await resend.emails.send({
    from: mailFrom(),
    to: adminEmail(),
    subject: `Low Stock Alert: ${part.partName}`,
    react: LowStockAlert({ partName: part.partName, compatibleModel: part.compatibleModel, quantity: part.quantity }),
  })
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `cd web && npm test -- tests/lib/email.test.ts`
Expected: 5 passed

- [ ] **Step 9: Modify `web/lib/orders.ts`** — replace the `finalizeOrder` function (leave `createOrderDraft`, `setStripePaymentIntentId`, `findOrderByStripePaymentIntentId` untouched) with:

```typescript
export async function finalizeOrder(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) throw new ApiError(404, 'Order not found')
  if (order.status === 'PAID') return

  const lowStockPartIds: number[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const part = await tx.part.findUnique({ where: { id: item.partId } })
      if (!part) throw new ApiError(404, `Part not found: ${item.partId}`)
      const newQuantity = part.quantity - item.quantity
      if (newQuantity < 0) {
        await tx.order.update({ where: { id: orderId }, data: { status: 'PAYMENT_REVIEW' } })
        throw new ApiError(409, `Insufficient stock for part: ${part.partName} after payment`)
      }
      await tx.part.update({ where: { id: part.id }, data: { quantity: newQuantity } })
      if (newQuantity <= 5) lowStockPartIds.push(part.id)
    }
    await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } })
  })

  const updatedOrder = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (updatedOrder) {
    await sendOrderConfirmationEmail(updatedOrder)
    await sendOrderAlertAdminEmail(updatedOrder)
  }

  for (const partId of lowStockPartIds) {
    const part = await prisma.part.findUnique({ where: { id: partId } })
    if (part) await sendLowStockAlertEmail(part)
  }
}
```

Add this import at the top of `web/lib/orders.ts`:

```typescript
import { sendOrderConfirmationEmail, sendOrderAlertAdminEmail, sendLowStockAlertEmail } from '@/lib/email'
```

- [ ] **Step 10: Update `web/tests/lib/orders.test.ts`** (from Task 14) — add a mock for `lib/email` so the existing `finalizeOrder` tests don't hit real Resend calls. Add this near the top of the file, after the `vi.mock('@/lib/prisma', ...)` block:

```typescript
vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendOrderAlertAdminEmail: vi.fn(),
  sendLowStockAlertEmail: vi.fn(),
}))
```

- [ ] **Step 11: Run the full test suite, verify nothing regressed**

Run: `cd web && npm test`
Expected: all tests pass

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add react-email templates and wire Resend into order finalization"
```

---

### Task 24: Playwright e2e critical flows

**Files:**
- Create: `web/playwright.config.ts`
- Create: `web/e2e/auth.spec.ts`
- Create: `web/e2e/browse-cart-checkout.spec.ts`
- Create: `web/e2e/admin-crud.spec.ts`
- Create: `web/e2e/appointment-booking.spec.ts`
- Modify: `web/.env.example` (add e2e test-account variables)

**Prerequisites (manual, one-time, before this task's specs can run):**
1. In the Clerk dashboard, create two test users: a `CLIENT`-role user and an `ADMIN`-role user (set `publicMetadata.role` accordingly, or promote via the admin UI from Task 21 once it's live). Use email+password sign-up.
2. Set these in `web/.env` (not `.env.example`, real secrets): `E2E_CLIENT_EMAIL`, `E2E_CLIENT_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
3. Ensure `STRIPE_SECRET_KEY`/`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are Stripe **test-mode** keys (the checkout spec uses Stripe's `4242 4242 4242 4242` test card).
4. Seed at least one `Part` with quantity ≥ 5 (for the cart/checkout flow) via the admin parts page or `prisma studio`.

**Interfaces:**
- Consumes: the full running app (all prior tasks) at `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`).

- [ ] **Step 1: Install Playwright and the Clerk testing helper**

```bash
cd web
npm install -D @playwright/test @clerk/testing
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Modify `web/.env.example`** — append:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000
E2E_CLIENT_EMAIL=
E2E_CLIENT_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
```

- [ ] **Step 3: Write `web/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

Add to `web/package.json` scripts: `"test:e2e": "playwright test"`.

- [ ] **Step 4: Write `web/e2e/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('a signed-out visitor can reach the sign-in page from the navbar', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/')
  await page.getByRole('link', { name: 'Login' }).click()
  await expect(page).toHaveURL(/sign-in/)
})

test('an existing client can sign in and see the account menu', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/sign-in')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLIENT_EMAIL!,
      password: process.env.E2E_CLIENT_PASSWORD!,
    },
  })
  await page.goto('/')
  await expect(page.getByText('CLIENT')).toBeVisible()
})
```

- [ ] **Step 5: Write `web/e2e/browse-cart-checkout.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('a signed-in client can browse parts, add one to cart, and reach the Stripe payment step', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/sign-in')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLIENT_EMAIL!,
      password: process.env.E2E_CLIENT_PASSWORD!,
    },
  })

  await page.goto('/parts')
  await expect(page.getByRole('heading', { name: /Suzuki (Bike|Scooter) Parts/ })).toBeVisible()

  await page.locator('article').first().getByRole('button').last().click() // Add to Cart icon button
  await page.goto('/cart')
  await expect(page.getByText('Shopping Cart')).toBeVisible()

  await page.getByRole('link', { name: 'Proceed to Checkout' }).click()
  await expect(page).toHaveURL(/checkout/)

  await page.getByLabel('Full Name *').fill('E2E Test User')
  await page.getByLabel('Phone *').fill('9800000000')
  await page.getByLabel('Address *').fill('Balkumari, Lalitpur')
  await page.getByRole('button', { name: 'Continue to Payment' }).click()

  await expect(page.getByText('Pay with Card')).toBeVisible({ timeout: 15_000 })

  const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]').first()
  await stripeFrame.getByPlaceholder('1234 1234 1234 1234').fill('4242424242424242')
  await stripeFrame.getByPlaceholder('MM / YY').fill('12/30')
  await stripeFrame.getByPlaceholder('CVC').fill('123')

  await page.getByRole('button', { name: /^Pay Rs/ }).click()
  await expect(page).toHaveURL(/checkout\/success/, { timeout: 20_000 })
  await expect(page.getByText('Payment Successful!')).toBeVisible()
})
```

- [ ] **Step 6: Write `web/e2e/admin-crud.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('an admin can create, edit, and delete a bike', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/sign-in')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_ADMIN_EMAIL!,
      password: process.env.E2E_ADMIN_PASSWORD!,
    },
  })

  await page.goto('/bikes')
  const modelName = `E2E Test Bike ${Date.now()}`

  await page.getByRole('button', { name: 'Add Bike' }).click()
  await page.getByLabel('Model Name *').fill(modelName)
  await page.getByLabel('Price (Rs)').fill('250000')
  await page.getByLabel('Stock quantity').fill('5')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText(modelName)).toBeVisible()

  await page.getByText(modelName).locator('..').locator('..').getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Price (Rs)').fill('260000')
  await page.getByRole('button', { name: 'Update' }).click()
  await expect(page.getByText('Rs 2,60,000')).toBeVisible()

  await page.getByText(modelName).locator('..').locator('..').getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete' }).last().click()
  await expect(page.getByText(modelName)).not.toBeVisible()
})
```

- [ ] **Step 7: Write `web/e2e/appointment-booking.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('a client can book a service appointment and an admin can approve it', async ({ browser }) => {
  const clientContext = await browser.newContext()
  const clientPage = await clientContext.newPage()
  await setupClerkTestingToken({ page: clientPage })
  await clientPage.goto('/sign-in')
  await clerk.signIn({
    page: clientPage,
    signInParams: { strategy: 'password', identifier: process.env.E2E_CLIENT_EMAIL!, password: process.env.E2E_CLIENT_PASSWORD! },
  })

  await clientPage.goto('/book-service')
  await clientPage.getByLabel('Bike Model *').fill('Gixxer SF 250')
  await clientPage.getByText('Oil Change').click()
  const today = new Date()
  today.setDate(today.getDate() + 3)
  await clientPage.getByLabel('Preferred Date *').fill(today.toISOString().split('T')[0])
  await clientPage.locator('select').selectOption('10:00 AM')
  await clientPage.getByRole('button', { name: 'Book Appointment' }).click()
  await expect(clientPage).toHaveURL(/my-appointments/)
  await expect(clientPage.getByText('Gixxer SF 250')).toBeVisible()

  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await setupClerkTestingToken({ page: adminPage })
  await adminPage.goto('/sign-in')
  await clerk.signIn({
    page: adminPage,
    signInParams: { strategy: 'password', identifier: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! },
  })

  await adminPage.goto('/admin/appointments')
  await adminPage.getByPlaceholder('Search client...').fill(process.env.E2E_CLIENT_EMAIL!.split('@')[0])
  await adminPage.getByRole('button', { name: 'Search' }).click()
  await adminPage.getByRole('link').first().click()
  await adminPage.locator('select').first().selectOption('APPROVED')
  await adminPage.getByRole('button', { name: 'Save Changes' }).click()
  await expect(adminPage.getByText('Approved')).toBeVisible()

  await clientContext.close()
  await adminContext.close()
})
```

- [ ] **Step 8: Run the e2e suite against a locally running dev server**

Run: `cd web && npm run test:e2e`
Expected: 5 passed (requires the prerequisites above to be configured; if `E2E_CLIENT_EMAIL` etc. are unset, these specs fail fast with a clear "signInParams.identifier is required" error rather than hanging — that is the expected failure mode until the manual prerequisite setup is done)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "test: add Playwright e2e specs for auth, checkout, admin CRUD, and appointment booking"
```

---

### Task 25: Cutover

**Files:**
- Delete: `frontend/app` (entire directory)
- Delete: `server` (entire directory, including the dead legacy Express files under `server/controllers|models|routes|server.js`)
- Move: `web/*` → repo root
- Modify: `vercel.json`
- Modify: `README.md`
- Delete: `render.yaml`

**Gate:** do not start this task until Task 24's Playwright suite is green (`npm run test:e2e` passing) AND a manual smoke test of the following has been done against a locally running `npm run dev`: sign up → sign in, browse bikes/scooters/parts, add a part to cart → checkout with a Stripe test card, book a service appointment, admin CRUD on a vehicle, admin analytics page loads, admin user role toggle.

- [ ] **Step 1: Run the full test suite one final time**

Run: `cd web && npm test && npm run test:e2e`
Expected: all unit/integration and e2e tests pass

- [ ] **Step 2: Delete the old frontend and backend**

```bash
cd "/Users/sushanprajapati/Desktop/Suzuki Bike"
git rm -r frontend/app
git rm -r server
```

- [ ] **Step 3: Move `web/` contents to the repo root**

```bash
cd "/Users/sushanprajapati/Desktop/Suzuki Bike"
git mv web/* .
git mv web/.env.example .
git mv web/.gitignore .gitignore.web
# Merge .gitignore.web into the existing root .gitignore (the root .gitignore
# predates this migration and may have entries — e.g. .DS_Store — not in web/'s),
# then remove the temporary file:
cat .gitignore.web >> .gitignore
sort -u .gitignore -o .gitignore
rm .gitignore.web
rmdir web
```

- [ ] **Step 4: Delete the now-unused Render config**

```bash
git rm render.yaml
```

- [ ] **Step 5: Rewrite `vercel.json`** for a standard Next.js deployment (Next.js on Vercel needs no custom routing config — delete the file entirely, since its only content was the Vite SPA fallback route which Next.js doesn't need):

```bash
git rm vercel.json
```

- [ ] **Step 6: Rewrite `README.md`**

```markdown
# Suzuki Bike System

A full-stack Next.js application for Suzuki Motorcycle Nepal — public catalog, cart/checkout, service appointment booking, and an admin dashboard.

## Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** PostgreSQL (Supabase) via Prisma
- **Auth:** Clerk (email + password, optional phone verification)
- **Payments:** Stripe
- **Email:** Resend + react-email
- **Testing:** Vitest (unit/integration), Playwright (e2e)

## Local Development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, Clerk/Stripe/Resend keys
npx prisma generate
npm run dev
```

App runs at http://localhost:3000.

## Testing

```bash
npm test        # Vitest unit/integration
npm run test:e2e  # Playwright (requires E2E_* env vars — see .env.example)
```

## Deployment

Deployed on Vercel. Set the environment variables from `.env.example` in the Vercel project settings, including `CLERK_WEBHOOK_SECRET` (pointed at `https://<your-domain>/api/webhooks/clerk`) and `STRIPE_WEBHOOK_SECRET` (pointed at `https://<your-domain>/api/payments/webhook`).

## Architecture

Full migration design: see `docs/superpowers/specs/2026-07-23-nextjs-migration-design.md`.
```

- [ ] **Step 7: Verify the moved app still builds and runs from the repo root**

Run: `npm run build`
Expected: build succeeds with no errors

Run: `npm test`
Expected: all tests still pass after the move (paths are relative via the `@/*` alias, so the move should not break imports — this step confirms it)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: cut over to Next.js — remove Spring Boot backend and Vite frontend"
```

This is the final task of the migration. After this commit, the repository contains a single Next.js application at its root.
