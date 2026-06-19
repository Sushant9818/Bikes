# cURL tests (Auth + Phone OTP)

Base URL (context path `/api`): `http://localhost:8082/api` (or `8081` if using dev profile).

## 1. Register (creates user as PENDING_PHONE_VERIFICATION, sends OTP)

```bash
curl -s -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "phoneNumber": "9812345678"
  }'
```

Expected: `201` with body like `{"message":"OTP sent","phoneNumberMasked":"98******78"}`.

If Twilio is not configured: `503` with message "OTP service is not configured".

## 2. Verify phone (activate user)

Replace `123456` with the OTP code received (SMS or Verify logs in Twilio Console).

```bash
curl -s -X POST http://localhost:8082/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9812345678",
    "code": "123456"
  }'
```

Expected: `200` with `{"message":"Phone verified"}`.

Invalid/expired code: `400` with "Invalid or expired verification code".

## 3. Login (only allowed after phone verified)

```bash
curl -s -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

Expected: `200` with `{"token":"...","username":"testuser",...}`.

If phone not verified: `403` with "Phone not verified. Please verify OTP."

## 4. Resend OTP (optional)

```bash
curl -s -X POST http://localhost:8082/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9812345678"}'
```

Expected: `200` with `{"message":"OTP resent"}`.

## Error responses (no 500)

| Scenario              | HTTP | Body message / error        |
|-----------------------|------|-----------------------------|
| Missing Twilio config | 503  | OTP service is not configured |
| Invalid phone/code    | 400  | Invalid or expired verification code |
| Twilio API failure    | 502  | OTP service temporarily unavailable   |
