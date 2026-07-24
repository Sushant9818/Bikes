# Suzuki Bike System: Spring Boot → Next.js Migration

## Context

The Suzuki Bike System is currently split into two codebases:

- `frontend/app` — React 19 + Vite SPA (public catalog, cart/checkout, appointments, admin dashboard)
- `server` — Spring Boot 3.2 REST API (JWT auth, JPA/Hibernate over PostgreSQL/H2, Stripe payments, Twilio Verify SMS OTP, Thymeleaf email templates)

There is also a dead legacy Express/Mongoose server under `server/controllers|models|routes|server.js` — confirmed non-functional (`server.js` imports `./routes/payments` and `./controllers/paymentsController`, neither of which exists in the repo) and superseded entirely by the Spring Boot backend.

This spec covers replacing both live codebases with a single full-stack **Next.js** application, executed via subagent-driven-development (Haiku for implementation, Opus for review).

## Goals

- Replace Spring Boot + the React/Vite SPA with one Next.js (App Router) app.
- Preserve all existing product functionality: catalog browsing, cart/checkout with Stripe, service appointment booking, offers, contact/test-drive forms, admin CRUD, analytics, user management.
- Replace custom JWT + Twilio-gated auth with Clerk (email+password primary, Twilio-backed phone verification as an optional secondary factor).
- Keep using the same Supabase Postgres database — no data migration, only schema evolution.
- Ship with test coverage from the start (no tests exist in the current codebase).

## Non-goals

- No UI/UX redesign — this is a framework migration, not a redesign. Existing Tailwind + shadcn/ui components and page layouts carry over with mechanical adaptation.
- No feature additions beyond what exists today.
- No zero-downtime/parallel-run cutover — this is a big-bang cutover once the new app is verified working.

## Architecture

- **Next.js 15, App Router, TypeScript**, built fresh in a new top-level `web/` directory. `frontend/app` and `server` are left untouched and continue running until cutover.
- **Route Handlers** under `web/app/api/` replace every Spring controller: `vehicles`, `parts`, `offers`, `orders`, `payments/create-intent`, `payments/webhook`, `appointments`, `contact`, `test-drive`, `analytics/summary`, `admin/users`, `users/me`, `webhooks/clerk`.
- **Pages** under `web/app/` replace the React Router routes: public catalog/cart/checkout/offers/contact/test-drive/book-service, authenticated profile/my-orders/my-appointments, admin CRUD pages (vehicles, parts, offers, orders, analytics, users, appointments).
- Server Components for read-heavy listing pages (catalog, offers); Client Components for anything interactive (forms, cart, admin modals, checkout).
- UI is a faithful port: existing components (`ProductCard`, `PartCard`, `DataTable`, `AddEditModal`, `ConfirmDeleteDialog`, `Navbar`, etc.) are ported with mechanical adaptation — `next/link` instead of `react-router-dom`'s `Link`, `'use client'` directives added where state/hooks are used, `useRouter`/`useSearchParams` from `next/navigation`.

## Data model

- Prisma schema is **derived from the current Supabase schema** via `prisma db pull`, then hand-adjusted — not written from scratch. Same Postgres instance, no data migration.
- `users` table is repurposed to mirror Clerk: add a unique `clerkUserId` column; drop `password`, `phone_verified`, `email_verified_at` (Clerk now owns identity/verification); keep `role`, `email`, `phone_number` (now an unverified contact field), `created_at`/`updated_at`.
- Drop `verification_tokens` and `password_reset_tokens` tables entirely — Clerk replaces both flows.
- Everything else ports 1:1 as Prisma models with the same shape and relations: `Vehicle`, `Part`, `Offer`, `Order`/`OrderItem`, `Appointment` (its existing `appointment_services` join table — created by Hibernate's `@ElementCollection` — is introspected and modeled as-is, i.e. a Prisma relation to that table, not collapsed into a native array column), `TestDriveRequest`, `ContactRequest`.
- Schema changes apply via `prisma migrate dev` (local/shadow DB) to generate migrations, then `prisma migrate deploy` against the real Supabase instance.

## Auth & roles (Clerk)

- **Sign-in/sign-up**: email + password (closest to today's username+password, email replaces username as the identifier). Custom-styled pages using Clerk's `useSignIn`/`useSignUp` hooks — not Clerk's default themed widgets — to keep the existing red/white Suzuki visual identity.
- **Phone verification (optional secondary factor)**: Clerk's phone-number strategy, configured with the project's own Twilio account (Twilio does support Nepal SMS delivery, but requires carrier pre-registration/NTA compliance — confirmed via research during design). Exposed as a "Verify phone" action on the profile page via Clerk's `createPhoneNumber`/`prepareVerification`/`attemptVerification` flow. No custom OTP code — Clerk owns the lifecycle.
- **Role storage**: `publicMetadata.role` on the Clerk user (`ADMIN` | `CLIENT`), defaulting to `CLIENT` at creation. A Clerk JWT template includes `role` in session token claims so `middleware.ts` can gate admin routes with zero extra API calls.
- **DB sync**: `POST /api/webhooks/clerk` handles `user.created` (insert local `User` row: `clerkUserId`, `email`, `phone`, `role: CLIENT`), `user.updated` (re-sync role/email/phone), `user.deleted` (row kept, not hard-deleted — `Order`/`Appointment` hold FKs to it).
- **Promoting a user to ADMIN**: `AdminUsersPage`'s role dropdown calls `PUT /api/admin/users/[id]/role`, which uses Clerk's backend SDK to update `publicMetadata` on the Clerk user. That update fires the webhook above, which syncs the local mirror — Clerk stays the single source of truth.
- **`middleware.ts`**: public (no session) — GET on vehicles/parts/offers, POST on contact/test-drive, the Stripe webhook, the Clerk webhook. Everything else requires a session; admin routes additionally check the `role` claim.

## Payments (Stripe)

- `POST /api/payments/create-intent` (Clerk-authenticated): re-validates cart items server-side against current `Part` prices/stock (never trusts client-sent prices), creates an `Order` draft (`PENDING`) + `OrderItem`s, computes the total, creates a Stripe PaymentIntent with automatic payment methods, returns `clientSecret` + `orderDraftId`. `CheckoutPage` keeps using `@stripe/react-stripe-js` Elements as today.
- `POST /api/payments/webhook`: reads the raw request body, verifies the Stripe signature, and on `payment_intent.succeeded` finalizes the matching order inside a Prisma transaction — decrement `Part.quantity`, set `Order.status = PAID`, fire confirmation/alert emails. Insufficient stock after payment still routes to `PAYMENT_REVIEW`, matching current behavior.

## Email (Resend + react-email)

- Clerk owns verification/password-reset emails now — those two templates are dropped.
- Three business emails remain, ported as `react-email` components under `web/emails/`: `OrderConfirmationCustomer`, `OrderAlertAdmin`, `LowStockAlert`. Same trigger points as today's `EmailService` (order finalize → customer confirmation + admin alert; part stock ≤ 5 after an order → low-stock alert). Sent via the Resend SDK from `lib/email.ts`.
- Same `mail-enabled` env toggle pattern so local dev doesn't send real email unless configured.

## Testing

- **Vitest**: unit/integration tests for Route Handlers (Prisma test DB or mocked client), lib utilities (currency formatting, image-name mapping, catalog descriptions), and Prisma query logic. Written alongside each implementation task (TDD) — task reviewers check test coverage as part of spec compliance.
- **Playwright**: a focused set of critical e2e flows — sign-up/sign-in (using Clerk testing tokens to avoid real email delivery in CI), browse → add to cart → checkout with Stripe test mode → confirmation, admin CRUD on vehicles/parts, appointment booking → admin status update. Not exhaustive — just the paths that would be expensive to break silently.

## Cutover

Final task of the implementation plan:

1. Verify `web/`'s Playwright suite is green and do a manual smoke test of every major flow.
2. Delete `frontend/app` and `server` (including the already-dead legacy Express files under `server/controllers|models|routes|server.js`).
3. Move `web/`'s contents to the repo root.
4. Update the root `README.md`.
5. Replace Spring-Boot-specific deploy config (`server/Dockerfile`, `server/nixpacks.toml`, `server/Procfile`, `render.yaml`) with a standard Next.js Vercel deployment; update `vercel.json` accordingly. Exact Vercel config finalized at cutover time.

## Feature scope checklist (for plan decomposition)

- Public catalog: vehicles (bikes/scooters) list + detail, parts list + detail
- Cart (client-side, persisted) + checkout + Stripe payment + confirmation
- Offers: public list, admin CRUD
- Test-drive request form
- Contact form
- Service appointments: book, my-appointments (list/detail/reschedule/cancel), admin appointments (list/filter/stats/status-update/delete)
- Auth: sign up, sign in, profile (update username/email), phone verification (optional) — via Clerk
- Admin: vehicles/parts/offers CRUD, orders list + status update, analytics dashboard (revenue/orders charts, top parts, low stock), user management (list, role toggle, enable/disable toggle)
- Shared UI: navbar, footer, hero sections, product/part cards, admin data tables, modals, loading/skeleton states

## Execution notes

- Executed via `superpowers:subagent-driven-development` from a git worktree/branch (not on `main`).
- Implementer subagents: Haiku (per user request) — appropriate given most tasks will have complete specs from the plan (mechanical/transcription-level work).
- Task + final review subagents: Opus (per user request) — for both spec-compliance/quality gating per task and the final whole-branch review.
