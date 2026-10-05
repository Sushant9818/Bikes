# Admin Panel Setup Guide

**Last Updated:** 2026-10-05  
**Version:** 1.0.0 (MVP)

## Overview

The Suzuki Bike Admin Panel is a production-ready dashboard for managing inventory (Bikes, Scooters, Parts), monitoring KPIs, and auditing admin actions. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Prisma ORM with role-based access control (RBAC).

### Key Features

- **Role-Based Access Control (RBAC):** SUPER_ADMIN, ADMIN, USER roles
- **Dashboard with KPIs:** Total revenue, stock counts, month-over-month trends
- **Analytics Charts:** Monthly revenue (bar chart), revenue by category (pie chart)
- **Inventory Management:** Full CRUD for Bikes, Scooters, and Parts
- **Low-Stock Alerts:** Real-time warnings for parts below minimum stock
- **Activity Audit Log:** Immutable records of all admin actions (create, update, delete)
- **Image Upload:** Uploadthing integration for vehicle and part images
- **Dark Mode Support:** Responsive design with Tailwind CSS dark mode
- **Mobile Responsive:** Collapsible sidebar for mobile, full sidebar on desktop

---

## Quick Start

### 1. Prerequisites

Ensure these are installed and configured:

- **Next.js 14+** with App Router
- **PostgreSQL** database (Supabase or self-hosted)
- **Clerk** for authentication (free tier available)
- **Uploadthing** account for image uploads (free tier: 1GB/month)
- **Node.js 18+** and npm

### 2. Environment Variables

Copy `.env.example` to `.env.local` and populate:

```bash
cp .env.example .env.local
```

**Required for Admin Panel:**

```env
# Database
DATABASE_URL=postgresql://user:password@host/dbname
DIRECT_URL=postgresql://user:password@host:5432/dbname

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Uploadthing (for image uploads)
UPLOADTHING_SECRET=ut_secret_...
UPLOADTHING_APP_ID=ut_app_id_...

# Admin Email (for notifications)
ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run Prisma migrations to create admin tables:

```bash
npx prisma migrate dev
```

This creates:
- `users` table with `role` enum (SUPER_ADMIN | ADMIN | USER)
- `vehicles` table with admin fields (slug, specs, colors, SEO fields)
- `parts` table with SKU and minimum stock tracking
- `activity_logs` table for audit trail
- `stock_history` table for inventory changes

### 4. Seed Database (Optional)

Populate test data:

```bash
npx prisma db seed
```

This creates:
- SUPER_ADMIN test user (`admin@suzuki-bike.com`)
- 2 sample bikes (GSX-R1000, Gixxer 250)
- 1 sample scooter (Access 125)
- 3 sample parts with low-stock thresholds

### 5. Install Dependencies

Ensure all required packages are installed:

```bash
npm install @tanstack/react-table uploadthing @uploadthing/react date-fns
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/admin` and log in with a SUPER_ADMIN or ADMIN account.

---

## Architecture

### Access Control

**Middleware** (`middleware.ts`):
- Protects `/admin/*` routes
- Checks user role in Prisma before allowing access
- Redirects non-admins to `/permission-denied`

**Authorization** (`lib/auth.ts`):
- `requireAdmin()` - Allows SUPER_ADMIN | ADMIN
- `requireSuperAdmin()` - Allows SUPER_ADMIN only

**Permissions** (`lib/admin/permissions.ts`):
- Helper functions for UI-level checks
- Example: `canEditBikes(role)`, `canDeleteParts(role)`

### Database Schema

#### User Model

```prisma
model User {
  id              Int       @id @default(autoincrement())
  clerkUserId     String    @unique
  email           String    @unique
  username        String    @unique
  fullName        String?
  role            Role      @default(USER)        // SUPER_ADMIN | ADMIN | USER
  status          String    @default("ACTIVE")    // ACTIVE | INACTIVE
  avatar          String?
  lastLogin       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Vehicle Model (Bikes/Scooters)

```prisma
model Vehicle {
  id              Int
  type            VehicleType                     // BIKE | SCOOTER
  modelName       String    @unique
  slug            String?   @unique
  category        String?                         // Sport, Commuter, Cruiser, etc.
  price           Float
  discountPrice   Float?
  quantity        Int
  colors          String[]  @default([])
  specs           Json?                           // Engine, mileage, power, etc.
  isFeatured      Boolean   @default(false)
  isNewArrival    Boolean   @default(false)
  seoTitle        String?                         // Max 120 chars
  seoDescription  String?                         // Max 160 chars
  status          String    @default("ACTIVE")    // ACTIVE | DRAFT | OUT_OF_STOCK
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Part Model

```prisma
model Part {
  id              Int
  partName        String
  sku             String    @unique              // Must be unique per part
  category        String                         // Engine, Brake, Electrical, etc.
  compatibleModel String?
  price           Float
  quantity        Int
  minStock        Int       @default(10)         // Alert when quantity < minStock
  status          String    @default("ACTIVE")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### ActivityLog Model

```prisma
model ActivityLog {
  id              Int
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  action          String    // CREATE_BIKE, UPDATE_PART, DELETE_SCOOTER, etc.
  entityType      String    // Vehicle, Part, User, etc.
  entityId        Int?
  changes         Json?     // { before: {...}, after: {...} }
  createdAt       DateTime  @default(now())
}
```

### API Endpoints

All require `requireAdmin()` or `requireSuperAdmin()` authentication.

#### Dashboard

- **GET** `/api/admin/dashboard` → KPIs, charts, low-stock alerts, recent appointments

#### Bikes

- **GET** `/api/admin/bikes?page=1&search=&status=&category=&sort=` → List with pagination & filters
- **POST** `/api/admin/bikes` → Create new bike (logs to ActivityLog)
- **GET** `/api/admin/bikes/[id]` → Get bike details
- **PUT** `/api/admin/bikes/[id]` → Update bike (logs changes)
- **DELETE** `/api/admin/bikes/[id]` → Hard delete bike (logs action)

#### Scooters

- **GET** `/api/admin/scooters?page=1&...` → List with pagination & filters
- **POST** `/api/admin/scooters` → Create
- **GET** `/api/admin/scooters/[id]` → Details
- **PUT** `/api/admin/scooters/[id]` → Update
- **DELETE** `/api/admin/scooters/[id]` → Hard delete

#### Parts

- **GET** `/api/admin/parts?page=1&...` → List with pagination & filters
- **POST** `/api/admin/parts` → Create
- **GET** `/api/admin/parts/[id]` → Details
- **PUT** `/api/admin/parts/[id]` → Update
- **DELETE** `/api/admin/parts/[id]` → Hard delete

#### Audit Log

- **GET** `/api/admin/activity-logs?page=1&entityType=&action=` → View admin actions

---

## Usage

### Admin Dashboard

Navigate to `/admin` after login. You'll see:

1. **KPI Cards** (Top Row):
   - Total Revenue (month-to-date with % change)
   - Bikes in Stock (with % change)
   - Scooters in Stock (with % change)
   - Parts in Stock (with % change)

2. **Charts** (Middle Row):
   - Monthly Revenue (last 12 months, bar chart)
   - Revenue by Category (pie chart: Bikes, Scooters, Parts, Service)

3. **Low-Stock Alerts** (if parts below minStock):
   - Part name, SKU, current stock, minimum stock threshold

4. **Recent Appointments**:
   - Customer name, service type, date, status

### Managing Bikes

1. Go to **Admin > Bikes**
2. Click **+ Add Bike** to create new bike
3. Fill in **Details Tab**:
   - Model Name (e.g., "GSX-R1000")
   - Category (Sport / Commuter / Cruiser / Adventure)
   - Price & Discount Price (in Rs.)
   - Stock Quantity
   - Status (ACTIVE / DRAFT / OUT_OF_STOCK)
   - Check "Featured" or "New Arrival"

4. Add **Colors** (e.g., Red, Black, White)

5. Fill **Specs Tab** (optional but recommended):
   - Engine, Mileage, Power, Torque, Fuel Tank, Weight, Brakes, Tyres

6. Upload **Images** via Uploadthing (up to 10 images per bike)

7. Add **SEO metadata**:
   - Title (max 120 chars)
   - Description (max 160 chars)

8. Click **Save Bike**

**Edit or Delete:**
- Click **Edit** icon to update an existing bike
- Click **Delete** (trash icon) to remove; confirm the action
- All changes are logged to `activity_logs` table

### Managing Scooters

Same workflow as Bikes, but:
- Scooters do NOT have a "Category" field (only Bikes do)
- Otherwise, the form is identical

### Managing Parts

1. Go to **Admin > Parts**
2. Click **+ Add Part**
3. Fill in:
   - Part Name (e.g., "Oil Filter")
   - SKU (unique identifier, e.g., "OF-001")
   - Category (Engine / Brake / Electrical / Body / Accessories / Oil & Lubricants)
   - Compatible Model (optional, e.g., "GSX-R1000")
   - Price (in Rs.)
   - Stock Quantity
   - **Minimum Stock** (e.g., 10) - triggers low-stock alert when stock falls below this
   - Status (ACTIVE / DRAFT / OUT_OF_STOCK)

4. Upload image (optional)
5. Click **Save Part**

### Viewing Audit Log

The activity log is populated automatically on every bike/scooter/part create, update, or delete. Each entry records:
- Admin who performed the action
- Action type (CREATE_BIKE, UPDATE_PART, DELETE_SCOOTER, etc.)
- Entity ID
- Changes (before/after JSON for updates)
- Timestamp

*(Audit log UI page coming in Phase 2)*

---

## Roles & Permissions

### SUPER_ADMIN

- Full access to all admin functions
- Can create, update, delete bikes, scooters, parts
- Can promote/demote other admins (Phase 2)
- Can view audit logs
- Can export data (Phase 2)

### ADMIN

- Can create, update, delete bikes, scooters, parts
- Can view audit logs
- Cannot manage other admin users
- Cannot change own role

### USER (Customer)

- Cannot access `/admin/*` routes
- Receives 403 redirect to `/permission-denied`
- Can browse catalog and make orders

---

## Deployment

### Production Checklist

- [ ] Environment variables set in hosting platform (Vercel, Netlify, etc.)
- [ ] Database credentials secured (use managed service like Supabase)
- [ ] Clerk production API keys configured
- [ ] Uploadthing production credentials set
- [ ] ADMIN_EMAIL set to production admin inbox
- [ ] Database backups enabled
- [ ] Audit logs retained for compliance (if required by law)
- [ ] CORS or API rate limiting configured if needed

### Hosting (Vercel Example)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Project Settings > Environment Variables
4. Deploy

---

## Phase 2 Deferred Items

The following features are NOT in MVP but planned for Phase 2:

### User Management

- [ ] Admin user creation (SUPER_ADMIN only)
- [ ] Promote/demote admins (SUPER_ADMIN only)
- [ ] User suspension (ADMIN can suspend, SUPER_ADMIN can reinstate)
- [ ] Password reset (SUPER_ADMIN only)

### Soft Delete & Restore

- [ ] Implement soft delete for bikes, scooters, parts
- [ ] Add restore functionality in admin UI
- [ ] Audit trail for deletions

### Advanced Reporting

- [ ] Audit log viewer with filters and export
- [ ] Revenue reports (daily, weekly, monthly breakdowns)
- [ ] Inventory turnover analysis
- [ ] Customer purchase history
- [ ] CSV/PDF export functionality

### Inventory Management

- [ ] Stock adjustment form (for inventory corrections)
- [ ] Bulk upload (CSV) for bikes/scooters/parts
- [ ] Low-stock email notifications
- [ ] Inventory forecast / predictive analytics

### Marketing Tools

- [ ] Featured items carousel editor
- [ ] SEO bulk updater
- [ ] Email campaigns to customers
- [ ] Promotional discount code generator

### Performance & Optimization

- [ ] Dashboard data caching (Redis)
- [ ] Real-time stock updates (WebSocket)
- [ ] Pagination optimization for large datasets
- [ ] Database indexing review

### Compliance & Security

- [ ] Two-factor authentication (2FA) for admin
- [ ] Session timeout management
- [ ] Encryption for sensitive data
- [ ] GDPR data export / deletion

---

## Troubleshooting

### "Access Denied" on `/admin`

- Verify your user has SUPER_ADMIN or ADMIN role in the database
- Check Clerk authentication is working
- Ensure middleware.ts is loaded correctly

```bash
# Check user role in database:
npx prisma studio  # Browse "users" table and check "role" column
```

### Image Upload Fails

- Verify `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are set in `.env.local`
- Check Uploadthing dashboard for API key validity
- Ensure image is under 4MB and in a supported format (JPG, PNG, WebP)

### Dashboard Shows No Data

- Verify database has seed data: `npx prisma db seed`
- Check `/api/admin/dashboard` response in browser DevTools
- Ensure orders with status "PAID" exist for revenue calculation

### Low-Stock Alerts Not Showing

- Verify parts have `quantity < minStock` in the database
- Check `minStock` is set to a value greater than 0
- Refresh dashboard page

### Activity Log Not Recording

- Verify `activity_logs` table exists: `npx prisma studio`
- Check admin user has valid `id` in users table
- Review server logs for errors during create/update/delete

---

## Performance Tips

1. **Dashboard KPIs:**
   - KPI calculations query the database directly. For large datasets (>100k orders), consider caching with Redis or implementing materialized views.

2. **Image Upload:**
   - Uploadthing handles image optimization. No need to pre-resize.
   - Consider adding CDN caching headers if using custom domain.

3. **Data Table Pagination:**
   - Page size is set to 20 items per page. Adjust in API routes if needed.
   - Use indexes on `type`, `status`, `category` columns for faster filtering.

4. **Audit Logs:**
   - Activity logs grow quickly. Consider archiving old logs (>1 year) to separate table if storage is a concern.

---

## Support & Contact

For issues or feature requests:
- Check this guide first
- Review `/docs/superpowers/specs/` for design decisions
- Open an issue on GitHub (if applicable)
- Contact: prasusan123@gmail.com

---

## Changelog

### v1.0.0 (2026-10-05) - MVP Release

**Features:**
- Dashboard with KPIs and charts
- Full CRUD for bikes, scooters, parts
- Image upload via Uploadthing
- Activity audit log
- Role-based access control (SUPER_ADMIN, ADMIN, USER)
- Dark mode support
- Mobile responsive design

**Known Limitations:**
- Hard delete only (soft delete in Phase 2)
- No user management (Phase 2)
- Dashboard data not cached (performance impact on large datasets)
- No 2FA for admin accounts
- Audit logs not displayed in UI (Phase 2)

---

## Files & Directory Structure

```
/app/admin/
  ├── (dashboard)/
  │   ├── layout.tsx           # Admin layout wrapper (sidebar + topnav)
  │   ├── page.tsx             # Dashboard KPI page
  │   ├── bikes/
  │   │   ├── page.tsx         # Bikes list page
  │   │   ├── new/page.tsx      # Add bike form
  │   │   └── [id]/page.tsx     # Edit bike form
  │   ├── scooters/
  │   │   ├── page.tsx
  │   │   ├── new/page.tsx
  │   │   └── [id]/page.tsx
  │   └── parts/
  │       ├── page.tsx
  │       ├── new/page.tsx
  │       └── [id]/page.tsx
  ├── permission-denied/
  │   └── page.tsx             # Access denied error page
  └── api/
      └── admin/
          ├── dashboard/route.ts
          ├── bikes/
          │   ├── route.ts
          │   └── [id]/route.ts
          ├── scooters/
          │   ├── route.ts
          │   └── [id]/route.ts
          ├── parts/
          │   ├── route.ts
          │   └── [id]/route.ts
          ├── activity-logs/route.ts
          └── users/route.ts (Phase 2)

/components/admin/
  ├── Sidebar.tsx              # Collapsible sidebar navigation
  ├── TopNav.tsx               # Top navigation with theme toggle
  ├── DataTable.tsx            # Reusable TanStack Table wrapper
  ├── DashboardCards.tsx        # KPI card component
  ├── RevenueChart.tsx          # Monthly revenue bar chart
  ├── CategoryPieChart.tsx      # Category pie chart
  ├── ImageUpload.tsx           # Uploadthing file uploader
  └── forms/
      ├── BikeForm.tsx          # Bike add/edit form with tabs
      ├── ScooterForm.tsx        # Scooter add/edit form
      └── PartForm.tsx           # Part add/edit form

/lib/admin/
  ├── validations.ts           # Zod schemas for bikes, scooters, parts
  ├── permissions.ts           # Permission helper functions
  └── dashboard.ts             # KPI calculation functions

/middleware.ts                  # Route protection for /admin/*
/lib/auth.ts                    # requireAdmin(), requireSuperAdmin()
/prisma/schema.prisma          # Database schema with admin models
/prisma/seed.ts                # Seed data script
```

---

**End of Document**
