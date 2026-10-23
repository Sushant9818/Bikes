# Offers Admin Module Design

> **Goal:** Global promotions management in admin panel with CRUD, bulk actions, status tracking, and dashboard integration.

**Architecture:** TanStack Table list view with pagination, sorting, filtering. Create/edit via modal forms with Zod validation. Image uploads via Uploadthing. Status auto-calculated from dates (UPCOMING/ACTIVE/EXPIRED) with manual override toggle. Dashboard widget displays active offer count. All endpoints require admin authentication.

**Status Logic:** Offer status is ACTIVE if today falls between startDate and endDate AND isActive toggle is true. If startDate is future, status is UPCOMING. If endDate is past, status is EXPIRED. Manual isActive toggle can disable any offer regardless of date.

**Tech Stack:** Next.js 14, TypeScript, Prisma (Offer model), Uploadthing (image upload), Zod (validation), TanStack Table, shadcn/ui components, Tailwind CSS.

---

## UI & Components

### List Page (`/admin/offers`)
- **Table columns:** title, discount%, dateRange (startDate–endDate), status badge (color-coded), actions (edit/delete icons)
- **Search:** Text input searches title and description (case-insensitive)
- **Filters:** 
  - Status dropdown: UPCOMING, ACTIVE, EXPIRED (multi-select or single)
  - Discount range slider: min 0%, max 100%
- **Bulk actions:** Checkbox column for row selection + "Delete selected" button (with confirmation)
- **Pagination:** Page size selector (10/20/50), previous/next navigation
- **Add button:** "Add Offer" (red button, top right) → opens create modal

### Modal Form (Create/Edit)
- **Fields:**
  - Title (text input, required, max 100 chars)
  - Description (textarea, optional, max 500 chars)
  - Discount % (number input, required, 0-100)
  - Start Date (date picker, required)
  - End Date (date picker, required, must be > startDate)
  - Image upload (Uploadthing, optional, shows preview)
  - Manual toggle: "Disable this offer" (checkbox, disables regardless of dates)
- **Actions:** Save (blue), Cancel (gray)
- **Validation feedback:** Inline error messages below fields

### Dashboard Widget
- Card component showing: "Active Offers: X"
- Displays count of currently active offers (status=ACTIVE)
- Link to `/admin/offers` for quick access

---

## API Endpoints

### GET /api/admin/offers
Query parameters:
- `page` (number, default 1)
- `pageSize` (number, default 10)
- `search` (string, searches title + description)
- `status` (string, filter: UPCOMING|ACTIVE|EXPIRED, comma-separated for multi-select)
- `minDiscount` (number, filter: 0-100)
- `maxDiscount` (number, filter: 0-100)
- `sortBy` (string, field to sort by: title|discount|startDate|status, default: id)
- `sortOrder` (string: asc|desc, default: asc)

Response: `{ offers: Offer[], total: number, page: number, pageSize: number }`

### POST /api/admin/offers
Body:
```json
{
  "title": "string (required, max 100)",
  "description": "string (optional, max 500)",
  "discountPercent": "number (required, 0-100)",
  "startDate": "ISO Date string (required)",
  "endDate": "ISO Date string (required, > startDate)",
  "imageUrl": "string (optional, URL from Uploadthing)"
}
```
Response: Created offer object with auto-calculated status

### PUT /api/admin/offers/[id]
Body: Same as POST (update any fields)
Response: Updated offer object

### DELETE /api/admin/offers/[id]
Response: `{ success: true }`

### PATCH /api/admin/offers/[id]/status
Body: `{ isActive: boolean }`
Response: Updated offer with recalculated status

**Auth:** All endpoints require admin role (ADMIN or SUPER_ADMIN)

**Validation:**
- title: required, 1-100 chars
- discountPercent: required, 0-100
- startDate < endDate
- imageUrl: valid URL format if provided

---

## Data Flow

1. Admin clicks "Add Offer" → modal opens (empty form)
2. Admin fills form, uploads image → POST /api/admin/offers
3. API validates, saves to DB, returns offer with calculated status
4. List refreshes, new offer appears
5. Admin can: edit (PUT), delete (DELETE), bulk delete, toggle status (PATCH)
6. Status auto-updates based on date changes
7. Dashboard widget recalculates active count

---

## Testing

- Unit tests for status calculation logic (date ranges, manual toggle)
- API endpoint tests: CRUD operations, validation, auth checks, filtering/sorting
- Component tests: modal form submission, bulk delete confirmation, table rendering
- E2E tests: create offer, edit, delete, filter, toggle status

---

## Notes

- Status is read-only in list view (calculated server-side, shown as badge)
- Manual toggle (`isActive`) is the override mechanism
- Image uploads are optional; offers can exist without images
- Bulk delete shows confirmation modal before deletion
- Search is real-time (debounced 300ms) on client or server-side pagination
