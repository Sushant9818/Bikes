# Admin Panel MVP Design Spec
**Suzuki Bike System** – Production-Ready Admin Dashboard

**Date:** 2026-10-05  
**Scope:** Dashboard + Bikes/Scooters/Parts CRUD (Phase 1)  
**Auth:** Clerk + Prisma roles (SUPER_ADMIN | ADMIN | USER)  
**Stack:** Next.js 14+ App Router, TypeScript, Tailwind + shadcn/ui, Recharts, TanStack Table, Uploadthing, Prisma + PostgreSQL

---

## 1. Overview & Goals

Build a cohesive admin panel (`/admin/*` routes) for managing Suzuki Bike System inventory and data. MVP covers:
- **Dashboard:** KPI cards, revenue charts, low-stock alerts, recent appointments
- **Bikes Management:** CRUD with images, pricing, specs, categories, featured/new-arrival toggles
- **Scooters Management:** Same as bikes
- **Parts Management:** CRUD with SKU, part numbers, stock levels, min-stock alerts

**Success criteria:**
- All data in public pages (Bikes, Scooters, Parts, Offers) pulls from admin-managed DB
- Admin changes appear live immediately
- Role-based access enforced (SUPER_ADMIN and ADMIN can access; USER cannot)
- Image uploads work via Uploadthing
- Activity log records all admin mutations

---

## 2. Architecture

### 2.1 Routing & Layout

```
/app/admin/(dashboard)/
├── layout.tsx          # Admin wrapper: Sidebar + TopNav + main content area
├── page.tsx            # Dashboard overview
├── bikes/
│   ├── page.tsx        # Bikes list
│   └── [id]/page.tsx   # Edit bike (or modal in list)
├── scooters/
│   ├── page.tsx
│   └── [id]/page.tsx
└── parts/
    ├── page.tsx
    └── [id]/page.tsx

/app/api/admin/
├── bikes/
│   ├── route.ts        # GET (list + search), POST (create)
│   └── [id]/route.ts   # GET, PUT (update), DELETE
├── scooters/...        # Same pattern
├── parts/...           # Same pattern
└── dashboard/
    └── route.ts        # GET KPIs, charts data
```

### 2.2 Sidebar Navigation

**Collapsible sidebar** (always visible on desktop, drawer on mobile via `<Sheet>` from shadcn):
- Suzuki logo at top
- Menu items:
  - Dashboard (icon: LayoutDashboard)
  - Bikes (icon: Bike)
  - Scooters (icon: Zap)
  - Parts (icon: Package)
- Active state highlighted (Suzuki red #E30613)
- Collapse toggle (hamburger icon)
- Footer: User name + dropdown (Profile, Logout)

### 2.3 Top Navbar

- Left: Current page title (e.g., "Bikes Management")
- Center: Search box (model name, part name — global search, deferred to Phase 2)
- Right: Dark mode toggle (sun/moon icon), Profile dropdown (name, avatar, Logout)

### 2.4 Responsive Behavior

- **Desktop (1024px+):** Sidebar always visible, content wide
- **Tablet (768px–1023px):** Sidebar collapses to icons or drawer
- **Mobile (<768px):** Sidebar becomes drawer, opened via hamburger menu

---

## 3. Database Schema

### 3.1 Role Enum & User Model

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  USER
}

model User {
  id              Int       @id @default(autoincrement())
  clerkUserId     String    @unique
  username        String    @unique
  fullName        String?
  email           String    @unique
  phoneNumber     String?
  role            Role      @default(USER)
  status          String    @default("ACTIVE")  // ACTIVE | SUSPENDED | DELETED
  avatar          String?
  lastLogin       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  appointments    Appointment[]
  orders          Order[]
  activityLogs    ActivityLog[]
  
  @@map("users")
}
```

**Migration needed:** Existing users with `role: 'ADMIN'` → `'SUPER_ADMIN'`, `role: 'CLIENT'` → `'USER'`.

### 3.2 Vehicle Model (Bikes & Scooters)

```prisma
model Vehicle {
  id              Int         @id @default(autoincrement())
  type            VehicleType // BIKE | SCOOTER
  modelName       String      @unique
  slug            String?     @unique
  category        String?     // Sport, Commuter, Cruiser, Adventure (bikes); empty for scooters
  brand           String      @default("Suzuki")
  price           Float
  discountPrice   Float?
  year            Int?
  quantity        Int
  imageUrl        String?     // Primary image
  images          String[]    // Gallery: JSON array of URLs
  description     String?
  specs           Json?       // { engine, mileage, power, torque, fuel, weight, brakes, tyres }
  colors          String[]    // ["Red", "Black", "White"]
  status          String      @default("ACTIVE")  // ACTIVE | DRAFT | OUT_OF_STOCK
  isFeatured      Boolean     @default(false)
  isNewArrival    Boolean     @default(false)
  seoTitle        String?
  seoDescription  String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  stockHistory    StockHistory[]
  
  @@map("vehicles")
}
```

### 3.3 Part Model

```prisma
model Part {
  id              Int      @id @default(autoincrement())
  type            PartType // BIKE_PART | SCOOTER_PART
  partName        String
  sku             String   @unique
  category        String   // Engine, Brake, Electrical, Body, Accessories, Oil & Lubricants
  compatibleModel String?  // e.g., "Hero Xtreme / Honda CB" (free text for MVP)
  brand           String   @default("Suzuki")
  price           Float
  quantity        Int
  minStock        Int      @default(10)
  imageUrl        String?
  status          String   @default("ACTIVE")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  stockHistory    StockHistory[]
  orderItems      OrderItem[]
  
  @@map("parts")
}
```

### 3.4 Stock History (Audit Trail for Inventory)

```prisma
model StockHistory {
  id              Int       @id @default(autoincrement())
  vehicleId       Int?
  vehicle         Vehicle?  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  partId          Int?
  part            Part?     @relation(fields: [partId], references: [id], onDelete: Cascade)
  quantityChange  Int       // +10, -5, etc.
  reason          String    // "Sale", "Adjustment", "Return", "Damage"
  notes           String?
  createdAt       DateTime  @default(now())
  
  @@map("stock_history")
}
```

### 3.5 Activity Log (Audit Trail for Admin Actions)

```prisma
model ActivityLog {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  action          String    // "CREATE_BIKE", "UPDATE_SCOOTER", "DELETE_PART"
  entityType      String    // "Vehicle", "Part", "Offer"
  entityId        Int?
  changes         Json?     // { before: {...}, after: {...} } for audits
  createdAt       DateTime  @default(now())
  
  @@map("activity_logs")
}
```

**Note:** Order, Appointment, Offer, Enquiry models remain unchanged for MVP.

---

## 4. Authentication & Authorization

### 4.1 Clerk Integration (Existing)

- Keep existing Clerk auth (sign-in, sign-up, profile)
- Admin users sign in via same flow; role determined in Prisma User table

### 4.2 Middleware Protection

`middleware.ts` checks all `/admin/*` requests:
1. Is user authenticated (Clerk)?
2. Does user's Prisma record have role `SUPER_ADMIN` or `ADMIN`?
3. If no, redirect to `/permission-denied`

### 4.3 API Route Protection

Each admin API uses `requireAdmin()` helper (existing, kept):
```ts
export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    throw new ApiError(403, 'Admin access required')
  }
  return user
}
```

### 4.4 UI Permission Checks

- Sidebar: Only show `/admin` link if user is SUPER_ADMIN or ADMIN
- Forms: Submit buttons disabled if validation fails (no data leaves the client)
- Server always re-checks permissions before mutation

---

## 5. Dashboard

### 5.1 Layout

- **Header:** "Dashboard" title, date range selector (This Month | Last Month | Custom), Refresh button
- **KPI Cards (4 columns desktop, 2 tablet, 1 mobile):**
  1. Total Revenue (this month) — Rs. amount + % change badge
  2. Total Bikes in Stock — count + % change
  3. Total Scooters in Stock — count + % change
  4. Total Parts in Stock — count + % change
- **Charts (2 columns, stack on mobile):**
  1. Monthly Revenue (last 12 months) — bar chart
  2. Revenue by Category — pie chart (Bikes | Scooters | Parts | Service)
- **Alerts:** "Low Stock Parts" table (parts below minStock threshold)
- **Recent Appointments:** Last 5 service bookings, table with customer, date, status, link

### 5.2 Data Sources

- `/api/admin/dashboard` endpoint returns:
  ```json
  {
    "kpis": {
      "totalRevenue": 1500000,
      "revenueChange": 12.5,
      "bikesInStock": 45,
      "bikesChange": -5,
      "scootersInStock": 30,
      "scootersChange": 8,
      "partsInStock": 200,
      "partsChange": 3
    },
    "monthlyRevenue": [
      { "month": "Jan", "revenue": 100000 },
      { "month": "Feb", "revenue": 120000 },
      ...
    ],
    "categoryRevenue": [
      { "name": "Bikes", "value": 60, "percentage": 60 },
      { "name": "Scooters", "value": 25, "percentage": 25 },
      { "name": "Parts", "value": 10, "percentage": 10 },
      { "name": "Service", "value": 5, "percentage": 5 }
    ],
    "lowStockParts": [
      { "id": 1, "name": "Oil Filter", "sku": "OF-001", "stock": 2, "minStock": 10 }
    ],
    "recentAppointments": [
      { "id": 1, "customerName": "John", "date": "2026-10-05", "status": "PENDING", "service": "Oil Change" }
    ]
  }
  ```

### 5.3 Components

- `DashboardCards.tsx` — render 4 KPI cards with trend badges (green ↑ / red ↓)
- `RevenueChart.tsx` — Recharts BarChart (12 months)
- `CategoryPieChart.tsx` — Recharts PieChart (4 categories)
- `LowStockAlert.tsx` — badge count + table of low-stock items
- `RecentAppointmentsTable.tsx` — shadcn Table

---

## 6. Bikes Management

### 6.1 List Page (`/admin/bikes`)

- **Search & Filters:**
  - Search input: model name, slug
  - Filter dropdown: Status (All | Active | Draft | Out of Stock), Category (All | Sport | Commuter | Cruiser | Adventure)
  - Toggle: Featured, New Arrival
  - Sort: Name ↑↓, Price ↑↓, Stock ↑↓
- **Table (TanStack Table):**
  - Columns: Image (thumbnail), Model, Category, Price, Stock, Status (badge), Featured (✓), Actions (Edit, Delete, View)
  - Pagination: 20 per page
  - Bulk select: Select all / select rows → Bulk Delete
- **"Add Bike" button** (top-right, Suzuki red #E30613)

### 6.2 Add/Edit Modal or Page

**Tabs:**
1. **Details:**
   - Model Name (required, max 100)
   - Category (dropdown: Sport, Commuter, Cruiser, Adventure)
   - Price (Rs., required, positive)
   - Discount Price (optional, positive)
   - Stock Quantity (required, non-negative)
   - Status (Active | Draft | Out of Stock)
   - Featured toggle
   - New Arrival toggle
   - Colors (multi-input, add/remove)

2. **Specs:**
   - Engine (CC)
   - Mileage (km/L)
   - Power (bhp)
   - Torque (Nm)
   - Fuel Capacity (L)
   - Weight (kg)
   - Brakes (text)
   - Tyres (text)
   - Stored as JSON in `specs` field

3. **Images:**
   - Uploadthing dropzone (max 10 images)
   - Drag-to-reorder
   - Delete individual
   - First = gallery thumbnail

4. **SEO:**
   - Title (optional, max 120)
   - Description (optional, max 160)
   - Slug (auto-generated from model name, editable)

**Buttons:** Submit (Create / Update), Cancel

### 6.3 API Endpoints

**GET /api/admin/bikes**
- Query params: `page`, `search`, `status`, `category`, `sort`
- Returns: `{ data: Bike[], total: number, page: number }`
- Pagination: server-side, 20 per page
- Search: case-insensitive modelName or slug

**POST /api/admin/bikes**
- Body: BikeSchema (validated via Zod)
- Returns: created Bike + 201
- Records ActivityLog: `action: 'CREATE_BIKE'`, `changes: { after: {...} }`
- Redirects to edit or list on success

**PUT /api/admin/bikes/[id]**
- Body: partial BikeSchema
- Returns: updated Bike + 200
- Records ActivityLog: `action: 'UPDATE_BIKE'`, `changes: { before: {...}, after: {...} }`

**DELETE /api/admin/bikes/[id]**
- Returns: 204
- Records ActivityLog: `action: 'DELETE_BIKE'`, `changes: { before: {...} }`
- Hard delete for MVP

### 6.4 Validation (Zod)

```ts
export const bikeSchema = z.object({
  modelName: z.string().min(1, 'Required').max(100),
  category: z.enum(['Sport', 'Commuter', 'Cruiser', 'Adventure']),
  price: z.number().positive('Must be positive'),
  discountPrice: z.number().positive().optional(),
  quantity: z.number().int().min(0),
  status: z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  colors: z.array(z.string().min(1)),
  specs: z.record(z.any()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
})

export type BikeFormData = z.infer<typeof bikeSchema>
```

---

## 7. Scooters Management

**Identical to Bikes,** except:
- No `category` field (scooters don't have Sport/Commuter/etc.)
- Specs may differ slightly (e.g., scooters don't have "Brakes" in the same detail level)
- Table column omits Category
- Form tab shows scooter-specific specs

---

## 8. Parts Management

**Similar to Bikes,** with differences:
- Add `SKU` field (required, unique)
- Add `minStock` field (default 10)
- Add `category` field (dropdown: Engine, Brake, Electrical, Body, Accessories, Oil & Lubricants)
- No `colors`, no `category` grouping like bikes
- No Specs tab
- No Featured / New Arrival toggles
- Table shows: Image, Part Name, SKU, Category, Price, Stock, Min Stock, Status, Actions
- Low-stock highlighting in table (if stock < minStock, row background red/orange)
- Delete confirmation shows: "This will also remove associated stock history if applicable"

**API:** Same pattern as Bikes/Scooters (`GET`, `POST`, `PUT`, `DELETE /api/admin/parts/[id]`).

---

## 9. File Structure

```
/app/admin
  /(dashboard)
    /layout.tsx            # Sidebar + TopNav wrapper
    /page.tsx              # Dashboard
    /bikes
      /page.tsx            # List + inline add/edit modal
      /[id]
        /page.tsx          # Edit detail page (optional; modal in list also works)
    /scooters/...
    /parts/...

/app/api/admin
  /bikes
    /route.ts              # GET, POST
    /[id]
      /route.ts            # GET, PUT, DELETE
  /scooters/...
  /parts/...
  /dashboard
    /route.ts              # GET KPIs + charts

/components/admin
  /Sidebar.tsx
  /TopNav.tsx
  /DashboardCards.tsx
  /RevenueChart.tsx
  /CategoryPieChart.tsx
  /LowStockAlert.tsx
  /RecentAppointmentsTable.tsx
  /DataTable.tsx           # Reusable TanStack Table
  /ImageUpload.tsx         # Uploadthing wrapper
  /ConfirmDialog.tsx       # Delete confirmation
  /forms
    /BikeForm.tsx          # Tabs: Details, Specs, Images, SEO
    /ScooterForm.tsx
    /PartForm.tsx

/lib/admin
  /permissions.ts          # Helpers: canEditBike(user), canDeletePart(user)
  /dashboard.ts            # getKPIs(), getMonthlyRevenue(), getCategoryRevenue()
  /validations.ts          # Zod schemas

/prisma
  /schema.prisma           # Updated with new models
  /migrations/
    /[timestamp]_add_admin_fields.sql
```

---

## 10. Dependencies to Add

```json
{
  "uploadthing": "^6.0.0",
  "@uploadthing/react": "^6.0.0",
  "react-hook-form": "^7.0.0",  // if not present
  "zod": "^3.22.0",             // if not present
  "@tanstack/react-table": "^8.10.0",
  "recharts": "^2.10.0"          // already present
}
```

---

## 11. Implementation Order

1. **Schema & Migration** (Day 1)
   - Add new fields to Vehicle, Part
   - Create StockHistory, ActivityLog models
   - Write migration SQL
   - Seed test data (create SUPER_ADMIN user, 5 bikes, 5 scooters, 10 parts)

2. **Auth & Middleware** (Day 1–2)
   - Update `middleware.ts` to check role
   - Add role migration helper (ADMIN → SUPER_ADMIN, CLIENT → USER)
   - Test protected routes

3. **Admin Layout** (Day 2)
   - Sidebar component (collapsible, responsive drawer)
   - TopNav component (search, profile dropdown, dark toggle)
   - Admin layout.tsx wrapper
   - Style with Tailwind + shadcn (Button, Card, Input, DropdownMenu, Sheet)

4. **Dashboard** (Day 2–3)
   - `/api/admin/dashboard` endpoint (KPIs, revenue, charts)
   - DashboardCards component
   - RevenueChart, CategoryPieChart (Recharts)
   - LowStockAlert, RecentAppointmentsTable
   - Dashboard page `/admin` that pulls all together

5. **Bikes CRUD** (Day 3–4)
   - BikeForm component (tabs, validation, Uploadthing)
   - `/api/admin/bikes` (GET, POST)
   - `/api/admin/bikes/[id]` (GET, PUT, DELETE)
   - `/admin/bikes` list page with TanStack Table
   - Optional: `/admin/bikes/[id]` edit detail page
   - Test: create, edit, delete, search, filter, sort
   - ActivityLog integration

6. **Scooters CRUD** (Day 4)
   - Copy Bikes pattern
   - Adjust form (no category, scooter-specific specs)
   - Test

7. **Parts CRUD** (Day 4–5)
   - Copy Bikes pattern
   - Adjust form (SKU, minStock, no colors, no specs tab)
   - Low-stock highlighting
   - Test

8. **E2E Testing** (Day 5)
   - Login as admin
   - Create bike, edit, delete (verify ActivityLog)
   - Create part, check low-stock alert on dashboard
   - Verify images upload and display
   - Test responsive behavior (mobile drawer)

9. **Polish & Deploy** (Day 5)
   - Review error messages, loading states, empty states
   - Test dark mode in admin (already merged)
   - Commit to main branch

---

## 12. Success Criteria

- ✅ All `/admin/*` routes protected (non-admins redirected)
- ✅ Dashboard KPIs calculate correctly (revenue, stock counts)
- ✅ Bikes/Scooters/Parts CRUD fully functional
- ✅ Images upload via Uploadthing
- ✅ ActivityLog records all mutations
- ✅ Search, filter, sort, pagination work
- ✅ Responsive on mobile (sidebar drawer)
- ✅ Dark mode toggle functional in admin
- ✅ Form validation clear (Zod error messages)
- ✅ E2E tests pass (login → create bike → view on public page → delete)
- ✅ Public pages (Bikes, Scooters, Parts) pull from admin-managed data live

---

## 13. Deferred to Phase 2

- Orders Management (sales tracking)
- Revenue & Reports (advanced filtering, export CSV/PDF)
- Enquiries / Contact Messages
- Customers management
- Admin Management (create/edit/suspend other admins) — SUPER_ADMIN only
- Settings (showroom info, working hours, hero banner)
- Test Drive Requests tab
- Appointment status workflow (assign mechanic, service cost, print invoice)
- Bulk image upload optimization
- Search optimization (global search across entities)

---

## 14. Notes

- Keep Clerk as auth provider (no switch to NextAuth)
- Hard delete for MVP (soft delete deferred)
- No email notifications for MVP
- No image CDN optimization (direct Uploadthing URLs)
- Currency: NPR (Rs.)
- Date format: YYYY-MM-DD
