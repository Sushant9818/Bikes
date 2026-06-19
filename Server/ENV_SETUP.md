# Environment Setup

## Stripe

- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_`)
- `STRIPE_CURRENCY` - Currency code (default: `usd`)

Frontend (`.env` in `frontend/app/`):

- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)

## Twilio Verify (Phone OTP)

Required for registration and phone verification. If not set, OTP endpoints return **503 Service Unavailable**.

- `TWILIO_ACCOUNT_SID` - Twilio Account SID (from Twilio Console)
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_VERIFY_SERVICE_SID` - Verify Service SID (create a Verify service in Twilio Console)

Example `.env` (in project root or `server/`):

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Email (Spring Boot)

- `MAIL_HOST` - SMTP host (e.g. `smtp.gmail.com`, `smtp.mailtrap.io`)
- `MAIL_PORT` - SMTP port (587 for TLS)
- `MAIL_USER` - SMTP username
- `MAIL_PASS` - SMTP password
- `MAIL_FROM` - From address
- `ADMIN_EMAIL` - Admin email for order alerts and low-stock notifications
- `MAIL_ENABLED` - Set to `true` to send emails (default: `false`)

## Webhook Testing (Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:8081/api/payments/webhook`
4. Copy the webhook signing secret (`whsec_...`) and set `STRIPE_WEBHOOK_SECRET`
