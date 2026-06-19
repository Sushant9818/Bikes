# Environment Setup - Suzuki Bike System

## Backend (Spring Boot)

Create or update `server/src/main/resources/application.yml` or use environment variables:

```yaml
# Required for email verification & password reset
app:
  frontend-url: ${FRONTEND_URL:http://localhost:5173}
  mail-from: ${MAIL_FROM:noreply@example.com}
  mail-enabled: ${MAIL_ENABLED:false}

spring:
  mail:
    host: ${MAIL_HOST:}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USER:}
    password: ${MAIL_PASS:}
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend base URL for verification/reset links | `http://localhost:5173` |
| `MAIL_FROM` | Sender email address | `noreply@example.com` |
| `MAIL_ENABLED` | Enable sending emails | `true` or `false` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username | your-email@gmail.com |
| `MAIL_PASS` | SMTP password or app password | your-app-password |
| `JWT_SECRET` | JWT signing key (min 256 bits) | long-random-string |
| `VITE_API_BASE_URL` | Backend API base (frontend) | `http://localhost:8081/api` |

### Local Development (no SMTP)

When `MAIL_ENABLED=false`, registration and forgot-password won't send real emails. For testing:

1. **Use seeded users**: admin/admin123, client/client123 (both pre-verified)
2. **Temporary workaround**: Enable mail and use a service like Mailtrap, MailHog, or Gmail with app password

## Frontend (React)

Create `.env` or `.env.local` in `frontend/app/`:

```
VITE_API_BASE_URL=http://localhost:8081/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # if using Stripe checkout
```

## Run Steps

### Backend

```bash
cd server
mvn spring-boot:run
```

- Server: http://localhost:8081
- API base: http://localhost:8081/api

### Frontend

```bash
cd frontend/app
npm install
npm run dev
```

- App: http://localhost:5173

## URLs

| Page | URL |
|------|-----|
| Login | /login |
| Register | /register |
| Verify Email | /verify-email?token=xxx |
| Forgot Password | /forgot-password |
| Reset Password | /reset-password?token=xxx |
| Profile | /profile (RequireAuth) |
| My Orders | /my-orders (RequireAuth) |
| Admin Users | /admin/users (RequireAdmin) |
