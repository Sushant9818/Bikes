# Task 2: Orders Detail Page with Inline Editing

**Objective:** Create orders detail page with inline status editing. Status field allows edit/save with API call to PATCH endpoint.

**Files:**
- Create: `app/admin/(dashboard)/orders/[id]/page.tsx` - detail page server component
- Create: `components/admin/OrderDetail.tsx` - detail component with inline status editing
- Modify: `components/admin/OrdersTable.tsx` - add link to detail page from eye icon

**Interfaces:**
- Consumes: Existing `GET /api/admin/orders/[id]` and `PATCH /api/admin/orders/[id]` API endpoints
- Produces: OrderDetail component with status edit UI, detail page rendering it in Suspense

**Implementation Notes:**
- OrderDetail is a client component (uses useState for edit mode)
- Status select has 4 options: PENDING, PAID, SHIPPED, CANCELLED
- Edit mode shows select + Save/Cancel buttons
- Non-edit mode shows status badge with Edit button
- Error state shows red alert with error message
- Use same color coding as existing OrdersTable badges

**Report file:** `/Users/sushanprajapati/Desktop/Suzuki\ Bike/.superpowers/sdd-detail-pages/task-2-report.md`
