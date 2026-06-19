# SMS OTP Verification Setup

This guide explains how to configure and run the Suzuki Bike System with Twilio Verify for SMS OTP.

## Prerequisites

- Twilio account: https://www.twilio.com/try-twilio
- Node.js 18+ (frontend)
- Java 17+ (backend)
- Maven (backend)

## 1. Twilio Verify Service

1. Log in to [Twilio Console](https://console.twilio.com)
2. Go to **Verify** → **Services** → **Create new**
3. Name the service (e.g. "Suzuki Bike OTP")
4. Copy the **Service SID** (starts with `VA...`)

## 2. Environment Variables

### Backend (Spring Boot)

Create or update `server/.env` or set these variables:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or export before running:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_VERIFY_SERVICE_SID=VA...
```

Get Account SID and Auth Token from: https://console.twilio.com (Dashboard)

### Frontend

`.env` in `frontend/app/`:

```bash
VITE_API_BASE_URL=http://localhost:8081/api
```

## 3. Run Backend

```bash
cd server
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

For PostgreSQL (prod profile):

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=default
```

Backend runs at `http://localhost:8081/api`

## 4. Run Frontend

```bash
cd frontend/app
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## 5. Registration Flow

1. User visits `/register` → fills username, email, phone (10 digits), password
2. Submit → backend creates user with `phoneVerified=false`, `enabled=false`, sends OTP via Twilio
3. User redirected to `/verify-otp` with phone number in state
4. User enters 6-digit OTP → Verify → backend sets `phoneVerified=true`, `enabled=true`
5. User redirected to `/login` → can now log in

## 6. Nepal Phone Numbers

- Format: 10 digits, e.g. `98XXXXXXXX`
- Backend converts to E.164: `+97798XXXXXXXX` for Twilio
- Twilio Verify must support Nepal (+977) in your Verify service

## 7. Rate Limiting

- Resend OTP: max once every 30 seconds per phone (in-memory)
- Production: consider Redis for distributed rate limiting

## 8. Files Created/Modified

### Backend
- `service/TwilioVerifyService.java` (new)
- `service/OtpRateLimiter.java` (new)
- `service/AuthService.java` (modified)
- `controller/AuthController.java` (modified)
- `entity/User.java` (add phoneVerified)
- `dto/SendOtpRequest.java` (new)
- `dto/VerifyOtpRequest.java` (new)
- `dto/RegisterResponse.java` (new)
- `exception/PhoneNotVerifiedException.java` (new)
- `exception/GlobalExceptionHandler.java` (add PhoneNotVerified handler)
- `config/SecurityConfig.java` (permit send-otp, verify-otp)
- `config/DataSeeder.java` (set phoneVerified=true for admin/client)
- `application.yml`, `application-dev.yml` (Twilio config)
- `pom.xml` (Twilio dependency)

### Frontend
- `pages/VerifyOtpPage.jsx` (new)
- `pages/RegisterPage.jsx` (redirect to verify-otp)
- `pages/LoginPage.jsx` (handle 403 phone not verified)
- `api/auth.js` (sendOtp, verifyOtp)
- `App.jsx` (route /verify-otp)
