# Suzuki Bike System - Unified React App

A unified React application with role-based access control (CLIENT/ADMIN).

## Features

- **Role-based access**: CLIENT (read-only) and ADMIN (full CRUD)
- **Modern UI**: Tailwind CSS + shadcn/ui components
- **Responsive**: Mobile-first design with collapsible sidebar
- **Authentication**: JWT-based auth with protected routes
- **CRUD Operations**: Vehicles and Parts management (admin only)

## Tech Stack

- React 19 + Vite
- Tailwind CSS
- shadcn/ui components
- react-hook-form + zod validation
- Axios with interceptors
- React Router v6
- Sonner for toast notifications

## Setup

```bash
npm install
npm run dev
```

Runs at **http://localhost:5173**

## Environment

Copy `.env.example` to `.env` and set your backend URL:

```bash
cp .env.example .env
```

Example `.env` (copy from `.env.example`):
```
VITE_API_URL=http://localhost:8081/api
```

### Test catalog APIs (curl)

```bash
# List all vehicles
curl -s http://localhost:8081/api/vehicles

# Bikes only
curl -s "http://localhost:8081/api/vehicles?type=BIKE"

# Scooters only
curl -s "http://localhost:8081/api/vehicles?type=SCOOTER"

# Admin: add a bike (replace TOKEN with JWT from POST /api/auth/login)
curl -s -X POST http://localhost:8081/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"type":"BIKE","modelName":"Gixxer SF 250","year":2024,"price":450000,"quantity":5}'

# List parts
curl -s http://localhost:8081/api/parts
```

### Test register via curl

With the backend running (e.g. on port 8082):

```bash
curl -s -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!","phoneNumber":"9812345678"}'
```

Expected: `201` with `{"message":"OTP sent","phoneNumberMasked":"98******78"}` (or 503 if Twilio is not configured).

## Login

- Username: `admin`
- Password: `admin123` (or as configured in backend)

## Pages

- `/` - Home (featured vehicles & parts)
- `/vehicles` - Vehicles catalog (CRUD for admin)
- `/parts` - Parts catalog (CRUD for admin)
- `/offers` - Offers (placeholder)
- `/test-drive` - Test drive booking (placeholder)
- `/contact` - Contact form (placeholder)
- `/login` - Admin login

## Role Behavior

- **CLIENT (not logged in)**: View-only access, no CRUD buttons
- **ADMIN (logged in)**: Full CRUD access, Add/Edit/Delete modals

---

## How to Add Your Own Images

Images are stored locally under `public/assets/images/`. Use **royalty-free** sources only (Pexels, Unsplash) or your own photos.

### Folder structure
```
public/assets/images/
├── bikes/         # bike-1.jpg … bike-8.jpg
├── scooters/      # scooter-1.jpg … scooter-4.jpg
├── parts/         # part-1.jpg … part-5.jpg
├── placeholder.jpg
└── placeholder.svg
```

### Option 1: Drag & drop
1. Add your images (JPG/PNG) into `bikes/`, `scooters/`, or `parts/`
2. Use filenames: `bike-1.jpg`, `scooter-1.jpg`, `part-1.jpg`, etc.
3. Replacing an existing file updates the image immediately

### Option 2: Download from Pexels/Unsplash
1. Run the download script: `node tools/download-images.js` (from project root)
2. Edit `tools/download-images.js` and paste Pexels/Unsplash image URLs into the `URLS` config
3. Run again to fetch images into `bikes/` and `scooters/`

### Option 3: Admin UI
1. Log in as ADMIN
2. Edit a vehicle or part
3. Set **Image URL** to e.g. `/assets/images/bikes/bike-1.jpg`
4. Save

### Fallback
If `imageUrl` is missing or the image fails to load, the app shows `placeholder.jpg`.
