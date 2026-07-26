# Suzuki Bike System

A full-stack Next.js application for Suzuki Motorcycle Nepal — public catalog, cart/checkout, service appointment booking, and an admin dashboard.

## Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** PostgreSQL (Supabase) via Prisma
- **Auth:** Clerk (email + password, optional phone verification)
- **Payments:** Stripe
- **Email:** Resend + react-email
- **Testing:** Vitest (unit/integration), Playwright (e2e)

## Local Development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, Clerk/Stripe/Resend keys
npx prisma generate
npm run dev
```

App runs at http://localhost:3000.

## Testing

```bash
npm test        # Vitest unit/integration
npm run test:e2e  # Playwright (requires E2E_* env vars — see .env.example)
```

## Deployment

Deployed on Vercel. Set the environment variables from `.env.example` in the Vercel project settings, including `CLERK_WEBHOOK_SECRET` (pointed at `https://<your-domain>/api/webhooks/clerk`) and `STRIPE_WEBHOOK_SECRET` (pointed at `https://<your-domain>/api/payments/webhook`).

## Architecture

Full migration design: see `docs/superpowers/specs/2026-07-23-nextjs-migration-design.md`.
