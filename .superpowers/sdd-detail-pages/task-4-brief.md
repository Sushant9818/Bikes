# Task 4: Appointments Detail Page with Status Workflow

**Objective:** Create appointments detail page with status workflow state machine (SCHEDULED → IN_PROGRESS → COMPLETED). Users can only transition forward, not backward.

**Files:**
- Create: `app/admin/(dashboard)/appointments/[id]/page.tsx` - detail page server component
- Create: `components/admin/AppointmentDetail.tsx` - detail component with status workflow UI
- Modify: `components/admin/AppointmentsTable.tsx` - add link to detail page from eye icon

**Interfaces:**
- Consumes: Existing `GET /api/admin/appointments/[id]` and `PATCH /api/admin/appointments/[id]` API endpoints
- Produces: AppointmentDetail component with status state machine UI

**Implementation Notes:**
- Status steps: [SCHEDULED, IN_PROGRESS, COMPLETED] in order
- Show current status badge with icon (Clock, PlayCircle, CheckCircle2)
- Show visual progress bar (numbered steps 1-3, filled up to current, line between)
- Button "Move to [NextStatus]" enabled only if not at final state
- Button disabled during API call
- Color-coded status badges: SCHEDULED=blue, IN_PROGRESS=yellow, COMPLETED=green
- Display appointment details (client, bike model, service, date, cost)
- Error state shows red alert with error message

**Report file:** `/Users/sushanprajapati/Desktop/Suzuki\ Bike/.superpowers/sdd-detail-pages/task-4-report.md`
