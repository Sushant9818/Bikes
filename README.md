# Suzuki Bike System

A modern, fully responsive full-stack web application: **public website** + **admin dashboard** + **Spring Boot API**.

## Repository Structure

```
/server              - Spring Boot API (port 8081)
/frontend
  /public-web        - React public site (port 5173)
  /admin-web         - React admin dashboard (port 5174)
```

## Tech Stack

- **Backend:** Spring Boot 3.2, JPA, PostgreSQL / H2, JWT auth
- **Frontend:** React (Vite), Tailwind CSS, shadcn/ui, React Router v6, Axios, lucide-react
- **Forms:** react-hook-form + zod

## Quick Start

### 1. Start the server

```bash
cd server
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Runs at **http://localhost:8081**. API base: **http://localhost:8081/api**.

### 2. Start the public website

```bash
cd frontend/public-web
npm install
npm run dev
```

Runs at **http://localhost:5173**.

### 3. Start the admin dashboard

```bash
cd frontend/admin-web
npm install
npm run dev
```

Runs at **http://localhost:5174**.

## API Endpoints

**Public (read-only + order creation):**
- `GET /vehicles?q=&type=BIKE|SCOOTER`
- `GET /vehicles/{id}`
- `GET /parts?q=&type=BIKE_PART|SCOOTER_PART`
- `GET /parts/{id}`
- `GET /offers`
- `POST /orders`
- `POST /test-drive` or `POST /test-drives`
- `POST /contact`

**Admin (JWT + role ADMIN required):**
- `POST /auth/login` → returns `{ token, role }`
- `POST /vehicles`, `PUT /vehicles/{id}`, `DELETE /vehicles/{id}`
- `POST /parts`, `PUT /parts/{id}`, `DELETE /parts/{id}`
- `POST /offers`, `PUT /offers/{id}`, `DELETE /offers/{id}`
- `GET /orders`, `PUT /orders/{id}/status`

## Routes

**Public website (frontend/public-web, port 5173):**
- `/` – Home (hero, featured vehicles, parts, offers)
- `/products` – Motorcycles & Scooters catalog
- `/products/:id` – Product detail, Book Test Drive
- `/parts` – Parts catalog
- `/parts/:id` – Part detail, Add to Cart
- `/cart` – Shopping cart
- `/checkout` – Place order (POST /orders)
- `/offers` – Offers list
- `/test-drive` – Test drive form (POST /test-drives)
- `/contact` – Contact form (POST /contact)

**Admin dashboard (frontend/admin-web, port 5174):**
- `/login` – Admin login (admin/admin123)
- `/admin/dashboard` – Stats cards (Total Vehicles, Parts, Low Stock, Orders)
- `/admin/vehicles` – CRUD vehicles
- `/admin/parts` – CRUD parts
- `/admin/offers` – CRUD offers
- `/admin/orders` – List orders, update status

## Environment Variables

| App        | Variable            | Default                   |
|------------|---------------------|---------------------------|
| frontend/public-web | VITE_API_BASE_URL   | http://localhost:8081/api |
| frontend/admin-web  | VITE_API_BASE_URL   | http://localhost:8081/api |
| server     | SERVER_PORT         | 8081                      |
| server     | SPRING_PROFILES_ACTIVE | dev                   |

## CORS

Server allows:
- http://localhost:5173 (public-web)
- http://localhost:5174 (admin-web)

## Images

Place product images in:
- `frontend/public-web/public/assets/images/`
- `frontend/admin-web/public/assets/images/`

Reference as `/assets/images/filename.jpg`. Pexels URLs are used as fallback when local images are not available.

**Static version (vanilla HTML/CSS/JS, localStorage):** Available at `/suzuki-ui/` when running public-web. No backend needed.

## Build

```bash
# Server
cd server && mvn clean package -Dspring-boot.run.profiles=default

# Public website
cd frontend/public-web && npm run build

# Admin dashboard
cd frontend/admin-web && npm run build
```
