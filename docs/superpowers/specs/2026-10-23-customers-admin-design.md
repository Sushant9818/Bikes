# Customers Admin Module Design

> **Goal:** Manage customer profiles, view order history, edit details, and track customer lifetime value.

**Architecture:** TanStack Table list view showing all users with order history. Click row to open profile modal with customer details (editable), aggregated stats, and order history table. Edit customer info via form modal. Bulk delete via checkboxes. Search across name, email, phone. Filters by registration date, order count, total spent. All endpoints require admin authentication.

**Note:** Deleting a customer removes the user account but preserves their orders (userId becomes nullable) for audit trail and payment reconciliation.

**Tech Stack:** Next.js 14, TypeScript, Prisma (User, Order models), TanStack Table, shadcn/ui components, Tailwind CSS.

---

## UI & Components

### List Page (`/admin/customers`)
- **Table columns:** Name, Email, Phone, Total Orders (count), Total Spent (₹), Registered Date, Actions (view icon, delete icon)
- **Search:** Text input searches name, email, phone (debounced 300ms)
- **Filters:**
  - Registration date range: start/end date pickers
  - Order count range: slider (0-100+)
  - Total spent range: slider (₹0-unlimited)
- **Sorting:** Clickable column headers (Name, Email, Total Orders, Total Spent, Registered)
- **Bulk actions:** Checkbox column + "Delete selected" button (confirmation modal)
- **Pagination:** Page size (10/20/50), prev/next navigation
- **Rows:** Click → opens profile modal

### Customer Profile Modal
- **Header:** Customer name, "Registered: [date]", close button
- **Details Section:**
  - Display: name, email, phone, address
  - Edit button → toggles editable form with fields: name, email, phone, address
  - Save/Cancel buttons when editing
- **Stats Section (read-only):**
  - Total Orders: [count]
  - Total Spent: ₹[amount]
  - Avg Order Value: ₹[amount]
  - Last Order: [date or "N/A"]
- **Order History Table:**
  - Columns: OrderID, Date, Status badge, Amount (₹)
  - Pagination (5 per page or show all)
  - Click row → opens full order detail modal (or link to /admin/orders/[id])
- **Actions:** Delete button (confirmation), close button

### Edit Customer Form
Modal or inline within profile:
- Fields: name (text), email (email), phone (tel), address (textarea)
- Validation: email required/valid, phone format optional
- Save/Cancel buttons

---

## API Endpoints

### GET /api/admin/customers
Query parameters:
- `page` (number, default 1)
- `pageSize` (number, default 10)
- `search` (string, searches: name, email, phone)
- `startDate` (ISO Date, filter registered >= this date)
- `endDate` (ISO Date, filter registered <= this date)
- `minOrders` (number, filter orders >= count)
- `maxOrders` (number, filter orders <= count)
- `minSpent` (number, filter totalSpent >= amount)
- `maxSpent` (number, filter totalSpent <= amount)
- `sortBy` (string: name|email|totalOrders|totalSpent|createdAt, default: createdAt)
- `sortOrder` (string: asc|desc, default: desc)

Response:
```json
{
  "customers": [
    {
      "id": number,
      "name": string,
      "email": string,
      "phone": string | null,
      "address": string | null,
      "createdAt": ISO Date,
      "totalOrders": number,
      "totalSpent": number,
      "avgOrderValue": number,
      "lastOrderDate": ISO Date | null
    }
  ],
  "total": number,
  "page": number,
  "pageSize": number
}
```

### GET /api/admin/customers/[id]
Returns: Full customer profile with stats and order history
```json
{
  "id": number,
  "name": string,
  "email": string,
  "phone": string | null,
  "address": string | null,
  "createdAt": ISO Date,
  "updatedAt": ISO Date,
  "stats": {
    "totalOrders": number,
    "totalSpent": number,
    "avgOrderValue": number,
    "lastOrderDate": ISO Date | null
  },
  "orders": [
    {
      "id": number,
      "createdAt": ISO Date,
      "status": string,
      "totalAmount": number
    }
  ]
}
```

### GET /api/admin/customers/[id]/orders
Query params: page, pageSize, sortBy (date|status|amount)

Response: `{ orders: Order[], total: number, page: number, pageSize: number }`

### PATCH /api/admin/customers/[id]
Body (update any fields):
```json
{
  "name": "string (optional)",
  "email": "string (optional, must be valid)",
  "phone": "string (optional)",
  "address": "string (optional)"
}
```

Response: Updated customer object

Validation: Email must be unique (if changed). Phone/address optional.

### DELETE /api/admin/customers/[id]
Response: `{ success: true }`

**Side effects:** User account deleted, but orders preserved with userId = null for audit trail.

**Auth:** All endpoints require admin role (ADMIN or SUPER_ADMIN)

---

## Data Flow

1. Admin navigates to `/admin/customers`
2. List loads with all customers (filtered by default or user criteria)
3. Admin can: search, filter, sort, select bulk delete
4. Click row → profile modal shows customer details, stats, order history
5. Click edit → form opens, admin edits name/email/phone/address
6. Click delete → confirmation modal, deletes account
7. Click order in history → opens full order detail modal or navigates to `/admin/orders/[id]`

---

## Calculations

**Stats calculated server-side:**
- Total Orders: COUNT(orders WHERE userId = [id])
- Total Spent: SUM(orders.totalAmount WHERE userId = [id] AND status = 'PAID')
- Avg Order Value: Total Spent / Total Orders
- Last Order Date: MAX(orders.createdAt WHERE userId = [id])

---

## Testing

- Unit tests for stat calculations (edge cases: no orders, all pending orders, etc.)
- API tests: GET list (pagination, filtering, sorting), GET detail, PATCH update, DELETE
- Component tests: table rendering, profile modal, edit form, order history
- E2E tests: view customer, filter, edit details, delete customer, view order history

---

## Notes

- Customer email must be unique (checked on PATCH)
- Stats exclude non-PAID orders from spending calculations (pending/cancelled orders don't count)
- Bulk delete shows: "Delete 3 customer accounts? Their orders will be preserved."
- Order history is paginated (5 per page) to avoid modal overflow
