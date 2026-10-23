# Appointments Admin Module Design

> **Goal:** Manage service appointments with scheduling, mechanic assignment, cost tracking, and status workflow.

**Architecture:** TanStack Table list view showing all appointments. Click row to open detail modal with appointment details (editable), services, costs, and mechanic assignment. Inline status dropdown with workflow validation (PENDING→APPROVED→IN_PROGRESS→COMPLETED; CANCELLED terminal). Bulk actions: delete, change status, assign mechanic. Search across client name, bike model, VIN, appointment ID. Filters by status, date range, mechanic, service type. All endpoints require admin authentication.

**Status Workflow:** PENDING → APPROVED → IN_PROGRESS → COMPLETED (linear progression). CANCELLED allowed from any state (terminal).

**Tech Stack:** Next.js 14, TypeScript, Prisma (Appointment, AppointmentService models), TanStack Table, shadcn/ui components, Tailwind CSS.

---

## UI & Components

### List Page (`/admin/appointments`)
- **Table columns:** AppointmentID, Client (clientUsername), Bike Model, Preferred Date, Status (inline dropdown), Mechanic (mechanicName), Actions (view icon, delete icon)
- **Search:** Text input searches clientUsername, bikeModel, vin, appointmentID (debounced 300ms)
- **Filters:**
  - Status: dropdown/multi-select (PENDING, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED)
  - Date range: start/end date pickers (preferredDate)
  - Mechanic: dropdown (distinct mechanicName values)
  - Service type: multi-select (from AppointmentService.service enum values)
- **Sorting:** Clickable column headers (AppointmentID, Client, Bike Model, Date, Status)
- **Bulk actions:**
  - Checkbox column + "Delete selected" (confirmation modal)
  - "Change status" button → modal with status selector (applies to checked rows)
  - "Assign mechanic" button → modal with mechanic selector (applies to checked rows)
- **Pagination:** Page size (10/20/50), prev/next navigation
- **Rows:** Click → opens detail modal

### Appointment Detail Modal
- **Header:** AppointmentID, client name, preferred date/time, close button
- **Bike Section:**
  - Display: model, year, VIN, registration number, mileage
  - Edit button toggles editable form
- **Service Section:**
  - Description (textarea)
  - Custom service (text)
  - Services list: checkboxes for AppointmentService types (WHEEL_CHANGE, OIL_CHANGE, INSPECTION, etc.)
- **Cost Section:**
  - Estimated cost (₹) — editable
  - Final cost (₹) — editable
  - Repair notes (textarea) — editable
- **Mechanic Section:**
  - Mechanic name: dropdown/typeahead (existing mechanics or free-text entry)
- **Status Section:**
  - Status: dropdown (PENDING|APPROVED|IN_PROGRESS|COMPLETED|CANCELLED)
  - Respects workflow: PENDING→APPROVED→IN_PROGRESS→COMPLETED allowed; CANCELLED from any state
  - Timestamps: created, updated (read-only)
- **Service notes:** (textarea) — editable
- **Actions:** Edit toggle (save/cancel buttons when editing), delete button (confirmation), close button

---

## API Endpoints

### GET /api/admin/appointments
Query parameters:
- `page` (number, default 1)
- `pageSize` (number, default 10)
- `search` (string, searches: clientUsername, bikeModel, vin, appointmentID)
- `status` (string: PENDING|APPROVED|IN_PROGRESS|COMPLETED|CANCELLED, comma-separated for multi-select)
- `startDate` (ISO Date, filter preferredDate >= this date)
- `endDate` (ISO Date, filter preferredDate <= this date)
- `mechanicName` (string, filter by assigned mechanic)
- `serviceType` (string: WHEEL_CHANGE|OIL_CHANGE|INSPECTION|etc., comma-separated)
- `sortBy` (string: id|clientUsername|preferredDate|status, default: id)
- `sortOrder` (string: asc|desc, default: desc)

Response: `{ appointments: Appointment[], total: number, page: number, pageSize: number }`

### GET /api/admin/appointments/[id]
Returns: Full appointment with all details and services
```json
{
  "id": number,
  "clientUsername": string,
  "bikeModel": string,
  "bikeYear": number | null,
  "vin": string | null,
  "registrationNumber": string | null,
  "mileage": number | null,
  "description": string | null,
  "customService": string | null,
  "preferredDate": ISO Date,
  "preferredTime": string,
  "status": "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  "estimatedCost": number | null,
  "finalCost": number | null,
  "repairNotes": string | null,
  "serviceNotes": string | null,
  "mechanicName": string | null,
  "services": ["WHEEL_CHANGE", "OIL_CHANGE", ...],
  "userId": number | null,
  "createdAt": ISO Date,
  "updatedAt": ISO Date
}
```

### PATCH /api/admin/appointments/[id]
Body (update any fields):
```json
{
  "bikeYear": number | null,
  "vin": string | null,
  "mileage": number | null,
  "description": string | null,
  "customService": string | null,
  "estimatedCost": number | null,
  "finalCost": number | null,
  "repairNotes": string | null,
  "serviceNotes": string | null,
  "mechanicName": string | null,
  "status": string,
  "services": [ServiceType]
}
```

Response: Updated appointment object

Validation: status changes follow workflow (PENDING→APPROVED→IN_PROGRESS→COMPLETED; CANCELLED from any)

### PATCH /api/admin/appointments/[id]/status
Body: `{ status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }`

Response: Updated appointment

Validation: Must follow workflow rules

### DELETE /api/admin/appointments/[id]
Response: `{ success: true }`

### GET /api/admin/mechanics (Helper endpoint)
Returns: `{ mechanics: string[] }` — list of distinct mechanicName values from appointments

**Auth:** All endpoints require admin role (ADMIN or SUPER_ADMIN)

---

## Data Flow

1. Admin navigates to `/admin/appointments`
2. List loads (can filter/search)
3. Admin can: change status inline, bulk delete, bulk change status, bulk assign mechanic
4. Click row → detail modal shows full appointment + services
5. Click edit → form opens for bike, cost, mechanic, notes
6. Change status → validates workflow, shows confirmation
7. Delete → confirmation modal, removes appointment
8. Bulk operations → show confirmation with count

---

## Status Workflow Validation

**Client-side:** Dropdown disabled for invalid transitions (UX feedback)

**Server-side:** PATCH rejects invalid transitions
- PENDING → APPROVED, CANCELLED
- APPROVED → IN_PROGRESS, CANCELLED
- IN_PROGRESS → COMPLETED, CANCELLED
- COMPLETED → CANCELLED
- CANCELLED → (none, terminal)

---

## Testing

- Unit tests for status workflow validation (all transitions)
- API tests: GET list (pagination, filtering, sorting), GET detail, PATCH update, PATCH status, DELETE
- Component tests: table rendering, detail modal, inline status change, bulk actions
- E2E tests: view appointments, filter by status/date/mechanic, change status, assign mechanic, delete appointment

---

## Notes

- Mechanic name is free-text or dropdown from existing mechanics (no separate Mechanic model, just distinct values)
- Services are checkboxes (multi-select) in detail view
- Bulk status change applies same status to all checked rows (respects workflow per appointment)
- Bulk mechanic assign applies to all checked rows
- Dates/times are read-only (cannot edit preferredDate/preferredTime, only admin notes)
- Cost fields (estimated/final) are for tracking, not auto-calculated
