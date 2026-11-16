# Orders Admin Module Design

> **Goal:** Manage customer orders with view, status editing, deletion, and detailed order inspection.

**Architecture:** TanStack Table list view with pagination, sorting, filtering. Click row to open detail modal/side panel. Inline status dropdown for status changes (PENDING → PAID → SHIPPED; CANCELLED terminal). Bulk delete via checkboxes. Search across customer name, email, phone, order ID. Filters by status, date range, amount range. All endpoints require admin authentication.

**Status Workflow:** PENDING → PAID or CANCELLED. PAID → SHIPPED or CANCELLED. SHIPPED → CANCELLED. CANCELLED is terminal (no transitions from CANCELLED).

**Tech Stack:** Next.js 14, TypeScript, Prisma (Order, OrderItem models), TanStack Table, shadcn/ui components, Tailwind CSS.

---

## UI & Components

### List Page (`/admin/orders`)
- **Table columns:** OrderID, Customer (name), Email, Amount (₹), Status (inline dropdown), Date (created), Actions (view icon, delete icon)
- **Search:** Text input searches customer name, email, phone, order ID (debounced 300ms)
- **Filters:**
  - Status: dropdown/multi-select (PENDING, PAID, SHIPPED, CANCELLED)
  - Date range: start date picker, end date picker
  - Amount range: slider min/max (₹)
- **Sorting:** Clickable column headers (OrderID, Customer, Amount, Date)
- **Bulk actions:** Checkbox column + "Delete selected" button (shows confirmation modal)
- **Pagination:** Page size selector (10/20/50), prev/next navigation
- **Rows:** Click any row → opens detail modal/side panel

### Order Detail Modal/Side Panel
- **Header:** OrderID, "Created: [date]", close button
- **Customer Section:**
  - Name, Email, Phone, Address (read-only display)
- **Items Section:**
  - Table: Part Name, Price (₹), Qty, Total (₹)
  - Subtotal, Grand Total
- **Payment Section:**
  - Status: dropdown (PENDING|PAID|SHIPPED|CANCELLED) — respects workflow rules
  - Total Amount (₹) — read-only
  - Stripe Payment Intent ID (copy button)
  - Timestamps: Created, Updated (read-only)
- **Actions:** Delete button (with confirmation), close button

### Status Dropdown Behavior
- In list: click to change status inline
- In detail: change status, shows confirmation if transitioning
- **Valid transitions:**
  - PENDING → PAID, CANCELLED
  - PAID → SHIPPED, CANCELLED
  - SHIPPED → CANCELLED
  - CANCELLED → (no transitions, disabled)

---

## API Endpoints

### GET /api/admin/orders
Query parameters:
- `page` (number, default 1)
- `pageSize` (number, default 10)
- `search` (string, searches: customerName, email, phone, orderID)
- `status` (string: PENDING|PAID|SHIPPED|CANCELLED, comma-separated for multi-select)
- `startDate` (ISO Date, filter orders >= this date)
- `endDate` (ISO Date, filter orders <= this date)
- `minAmount` (number, filter orders >= amount)
- `maxAmount` (number, filter orders <= amount)
- `sortBy` (string: id|customerName|totalAmount|createdAt, default: id)
- `sortOrder` (string: asc|desc, default: desc)

Response: `{ orders: Order[], total: number, page: number, pageSize: number }`

### GET /api/admin/orders/[id]
Returns: Full order object with:
- id, customerName, email, phone, address, totalAmount, status, stripePaymentIntentId
- items: [ { id, partId, quantity, price, part: { id, partName, ... } }, ... ]
- createdAt, updatedAt

### PATCH /api/admin/orders/[id]/status
Body: `{ status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" }`

Response: Updated order object with new status

Validation: Must follow status workflow rules (PENDING→PAID|CANCELLED, PAID→SHIPPED|CANCELLED, etc.)

### DELETE /api/admin/orders/[id]
Response: `{ success: true }`

**Auth:** All endpoints require admin role (ADMIN or SUPER_ADMIN)

---

## Data Flow

1. Admin navigates to `/admin/orders`
2. List loads with default filters (all statuses, last 30 days)
3. Admin can: search, filter, sort, change status inline
4. Click row → detail modal opens showing full order + items
5. In detail: change status (with confirmation), delete order (with confirmation)
6. Delete confirmation: "Are you sure? This cannot be undone."
7. Status change confirmation: "Change status from PENDING to PAID?"
8. List refreshes after any change

---

## Testing

- Unit tests for status workflow validation (allowed transitions)
- API tests: GET list (pagination, filtering, sorting), GET detail, PATCH status, DELETE
- Component tests: table rendering, inline status change, detail modal, bulk delete
- E2E tests: view orders, filter by status/date/amount, change status, delete order

---

## Notes

- Order details are read-only except for status
- Cannot edit customer info or items (immutable after order creation)
- Status dropdown validates workflow before API call (UX feedback)
- Bulk delete shows count: "Delete 3 orders?"
- Date/amount filters use range pickers (inclusive boundaries)
