# Shopping Cart with eSewa Checkout - Design Spec

**Goal:** Enable users to add bike/scooter parts to a persistent cart and checkout using eSewa payment gateway (Nepal).

**Scope:** Basic cart (add/remove/quantity), localStorage persistence for guests, database persistence for authenticated users, eSewa integration.

## Architecture

**State Management:**
- React Context (CartContext) provides `useCart()` hook
- Hook abstracts persistence layer: guests use localStorage, authenticated users use database
- Automatic sync when user logs in: merge guest localStorage cart into user's database cart
- Session: cart stays synced to database during active session

**Data Model:**
```
CartItem {
  id: string
  partId: number
  quantity: number
  price: number (cached at add time)
}

Cart {
  items: CartItem[]
  totalPrice: number (calculated)
  lastUpdated: Date
  userId?: string (only for auth users)
}
```

**Database Schema:**
Add to Prisma schema:
```
model CartItem {
  id: String @id @default(cuid())
  userId: String
  partId: Int
  quantity: Int
  price: Decimal
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
  
  user: User @relation(fields: [userId], references: [id], onDelete: Cascade)
  part: Part @relation(fields: [partId], references: [id])
  
  @@unique([userId, partId])
}
```

## Components & Pages

**CartContext** (`components/Cart/CartContext.tsx`):
- Exports `CartProvider` component and `useCart()` hook
- Hook returns: `{ items, totalPrice, addItem, removeItem, updateQuantity, clearCart }`
- Manages localStorage sync for guests, API calls for auth users

**Cart Page** (`app/(site)/cart/page.tsx`):
- Display: items with image, name, quantity selector, price, remove button
- Show total price
- "Proceed to Checkout" button
- Empty state when no items
- If guest: show login prompt before checkout

**AddToCart Button** (`components/AddToCart.tsx`):
- Reusable button component for part detail pages
- Shows "Add to Cart" or "Already in cart" state
- Quantity input if already in cart
- Success toast notification

**Checkout** (`app/(site)/checkout/page.tsx`):
- Require authentication (redirect guests to login)
- Show order summary (items, total)
- Confirm button → call eSewa API

**eSewa Integration** (`app/api/payments/esewa/*`):
- `POST /api/payments/esewa/initiate` - Create order, redirect to eSewa gateway
- `POST /api/payments/esewa/callback` - Handle eSewa callback, update order status
- `GET /api/payments/esewa/success` - Redirect after successful payment

## API Endpoints

```
GET /api/cart - Fetch current user's cart (auth required)
POST /api/cart - Add item to cart
PATCH /api/cart/:partId - Update quantity
DELETE /api/cart/:partId - Remove item from cart
POST /api/payments/esewa/initiate - Start eSewa checkout
POST /api/payments/esewa/callback - Handle eSewa webhook
```

## Payment Flow

1. User adds parts to cart (localStorage or database)
2. Clicks "Proceed to Checkout"
3. If guest: redirected to login
4. If auth: shown checkout summary
5. Clicks "Pay with eSewa"
6. Redirect to eSewa gateway with encrypted order details
7. User completes payment on eSewa
8. eSewa POSTs callback to `/api/payments/esewa/callback`
9. Callback verifies signature, updates order status
10. Redirect to `/checkout/success` page

## Error Handling

- Add to cart: show toast error if part not found or out of stock
- Checkout: validate cart not empty, all items still in stock
- eSewa callback: verify signature, log failures, retry mechanism
- Network errors: show friendly message with retry option

## Local Storage Format

```json
{
  "cart": {
    "items": [
      { "partId": 1, "quantity": 2, "price": 100, "id": "xxx" }
    ],
    "totalPrice": 200,
    "lastUpdated": "2026-11-13T10:00:00Z"
  }
}
```

## Testing

- Unit: CartContext logic (add/remove/quantity)
- Integration: Cart persistence (localStorage and database)
- E2E: Full checkout flow with eSewa mock
- Verify guest→auth cart merge on login

## Tech Stack

- React Context for state
- Next.js API routes for backend
- Prisma for database
- eSewa API for payments
- localStorage for guest persistence
- Tailwind for styling
