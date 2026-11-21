# Order Pick-up Tracking System - Design Spec

**Goal:** Enable customers to place orders for in-store pick-up with status tracking from checkout through fulfillment.

**Scope:** Customer checkout with store selection, pick-up time estimation, order status tracking (pending → ready → picked up), and admin order management with pick-up status updates.

## Architecture

**Data Flow:**
1. Customer selects store + time during checkout
2. Order created with pickupLocation, estimatedPickupTime, pickupCode
3. Admin confirms order → updates status to CONFIRMED
4. Admin marks READY_FOR_PICKUP when order is prepared
5. Customer views order and sees status + pickup details
6. Admin marks PICKED_UP when customer collects order

**Order Status States:**
```
PENDING → CONFIRMED → READY_FOR_PICKUP → PICKED_UP
                    ↘ CANCELLED
```

**Pick-up Code:** Auto-generated unique code per order (for reference at counter, barcode/QR for scanning)

## Database Schema Changes

Add to Prisma Order model:
```prisma
model Order {
  // existing fields...
  
  // Pick-up specific fields
  pickupLocation    String?         @map("pickup_location")      // e.g., "Kathmandu Store"
  estimatedPickupTime DateTime?     @map("estimated_pickup_time")
  pickupCode        String?         @unique               // Auto-generated
  actualPickupTime  DateTime?       @map("actual_pickup_time")
  
  @@map("orders")
}
```

Enum update:
```prisma
enum OrderStatus {
  PENDING
  PAID
  CONFIRMED
  READY_FOR_PICKUP      // New: order is prepared
  PICKED_UP             // New: customer collected
  SHIPPED               // For future delivery orders
  CANCELLED
  PAYMENT_REVIEW
  FAILED
}
```

## Components & Pages

### Customer Side

**OrderDetailPage** (`app/(site)/orders/[id]/page.tsx`):
- Order header: order ID, date, total
- Status card: current status badge + timeline (pending → confirmed → ready → picked up)
- Items section: list of items with quantities and prices
- Pick-up info section (if pickupLocation):
  - Store name/address
  - Pickup code (displayed prominently, with QR code)
  - Estimated pickup time
  - Store hours + contact
- Action buttons: none for pick-up orders (future: return request for shipped orders)

**PickupStatus Component** (`components/order/PickupStatus.tsx`):
- Shows status badge with color
- Timeline: 4 steps (pending/confirmed/ready/picked up)
- Current step highlighted
- Timestamps for transitions (confirmed at X, ready at Y)

**PickupInfo Component** (`components/order/PickupInfo.tsx`):
- Store address, phone, hours
- Pickup code (large text + QR code)
- Estimated pickup time
- Note: "Show this code at counter" or "Scan at pickup"

### Admin Side

**OrdersManagementPage** (`app/admin/(dashboard)/orders/page.tsx` - modify existing):
- Table of orders with new columns: Status, Pickup Location, Pickup Time
- Filter: pickup vs shipped (for future)
- Status update actions: Mark as CONFIRMED, READY_FOR_PICKUP, PICKED_UP

**OrderActionMenu** (new component):
- Dropdown or modal with status transition buttons
- Only show valid transitions (PENDING → CONFIRMED → READY_FOR_PICKUP → PICKED_UP)
- Confirm action with timestamp

### Checkout Changes

**CheckoutPage** (`app/(site)/checkout/page.tsx` - modify):
- Add "Delivery Method" selector:
  - "In-Store Pick-up" (default for MVP)
  - "Ship to Address" (grayed out / future)
- If pick-up selected:
  - Store selector dropdown (hardcoded for now: "Kathmandu Store", "Pokhara Store")
  - Time slot selector (e.g., "Today 3-5 PM", "Tomorrow 10-12 PM")
- Display selected pickup details in order summary
- Payment confirmation (Stripe)

## API Endpoints

**GET `/api/orders`** - User's orders (existing, no changes):
- Returns orders with pickupLocation, estimatedPickupTime, pickupCode

**GET `/api/orders/[id]`** - Order detail (modify to include pickup fields):
```json
{
  "id": 1,
  "customerName": "...",
  "totalAmount": 5000,
  "status": "CONFIRMED",
  "items": [...],
  "pickupLocation": "Kathmandu Store",
  "estimatedPickupTime": "2026-11-21T15:00:00Z",
  "pickupCode": "PKP-20261121-0001",
  "actualPickupTime": null,
  "createdAt": "2026-11-21T10:00:00Z"
}
```

**POST `/api/orders`** - Create order (modify to accept pickupLocation + timeSlot):
```json
Request:
{
  "items": [{ "partId": 1, "quantity": 2 }],
  "customerName": "...",
  "phone": "...",
  "email": "...",
  "pickupLocation": "Kathmandu Store",
  "pickupTimeSlot": "today-3-5pm"
}

Response: Order with pickupCode, estimatedPickupTime
```

**PATCH `/api/orders/[id]`** - Update order status (admin only):
```json
Request:
{
  "status": "READY_FOR_PICKUP"
}

Response: Updated order with new status + timestamp
```

**GET `/api/stores`** - Available pickup locations:
```json
{
  "stores": [
    { "id": 1, "name": "Kathmandu Store", "address": "...", "phone": "..." },
    { "id": 2, "name": "Pokhara Store", "address": "...", "phone": "..." }
  ]
}
```

## UI/UX Details

**Pick-up Code Display:**
- Large 14-16pt monospace font (e.g., "PKP-20261121-0001")
- QR code below (generated from code)
- Text: "Show this code at the counter" or "Scan at pickup"
- Copy-to-clipboard button

**Status Timeline:**
```
✓ Order Placed (Nov 21, 10:00 AM)
✓ Confirmed (Nov 21, 10:15 AM)
○ Ready for Pick-up (Estimated: Nov 21, 3:00 PM)
○ Picked Up
```

**Status Badges (Tailwind):**
- PENDING: yellow (bg-yellow-50, text-yellow-700)
- CONFIRMED: blue (bg-blue-50, text-blue-700)
- READY_FOR_PICKUP: green (bg-green-50, text-green-700)
- PICKED_UP: gray (bg-gray-50, text-gray-700)
- CANCELLED: red (bg-red-50, text-red-700)

**Dark Mode:** All status components and pick-up info use `dark:` classes for dark mode support (follow existing pattern from reviews, inventory alerts).

## Implementation Notes

**Pick-up Code Generation:**
```
Format: PKP-YYYYMMDD-XXXX
Example: PKP-20261121-0001 (order 1 on Nov 21)
Implementation: Prisma hook or custom function in order creation
```

**Store Hardcoding (MVP):**
Stores are hardcoded in the checkout component. Future: Move to database Store model and fetch via API.

**Time Slots:**
Hardcoded time slots initially (e.g., "Today 3-5 PM", "Tomorrow 10-12 AM"). Future: Admin configurable time slots.

**Estimated Pick-up Time:**
Set during checkout based on selected slot. No real-time calculation—admin manually updates if needed.

## Testing

**Unit Tests:**
- Pick-up code generation (uniqueness, format)
- Status transitions (valid states only)
- Order total calculation with tax (if applicable)

**Integration Tests:**
- Create order with pick-up location → verify pickupCode generated
- Fetch order detail → verify all pickup fields present
- Update order status → verify timestamp recorded

**E2E Tests:**
- Checkout with store selection → order created with correct pickup details
- Customer views order → sees status, pickup location, code
- Admin marks order ready → customer sees status update

## Error Handling

- Store selector required (default to first if only one)
- Time slot required (default to next available)
- Pick-up code must be unique (retry if collision, though unlikely)
- Status transitions validated (can't skip from PENDING to PICKED_UP)
- Display "Order not found" if customer tries to view another user's order

## Success Criteria

✓ Customers can select store and time during checkout
✓ Orders display pick-up location, code, and estimated time
✓ Admins can mark orders ready for pick-up
✓ Order status reflects pick-up workflow
✓ Dark mode support throughout
✓ Mobile responsive (checkout, order detail, pickup code display)
✓ Build succeeds with no TypeScript errors
