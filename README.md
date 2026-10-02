# Table & Tomato

<p align="center">
  <img src="docs/table-tomato-mark.svg" alt="Table & Tomato" width="720" />
</p>

> A practical food-delivery platform for discovering local restaurants, building an order, and managing restaurant operations.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma)](https://www.prisma.io/)
[![Stripe](https://img.shields.io/badge/Stripe-test_mode-635bff?logo=stripe)](https://stripe.com/docs/testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/havek16/food-delivery-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/havek16/food-delivery-platform/actions/workflows/ci.yml)

**Live local demo:** [http://localhost:3000](http://localhost:3000) after `npm run dev`

## Contents

- [Overview](#overview)
- [Highlights](#highlights)
- [Product walkthrough](#product-walkthrough)
- [Screens and routes](#screens-and-routes)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Stripe integration status](#stripe-integration-status)
- [API overview](#api-overview)
- [Current scope and limitations](#current-scope-and-limitations)
- [Roadmap](#roadmap)

## Overview

Table & Tomato is a full-stack delivery product designed around a realistic ordering journey rather than a static restaurant catalogue. Customers can discover nearby restaurants, filter by cuisine, browse menus, customize a cart, sign in before checkout, choose a delivery location, apply a coupon, and track an order. Restaurant partners and platform administrators have separate operational entry points.

The interface deliberately uses restrained visual design: compact cards, clear hierarchy, food photography, useful empty states, and responsive layouts that work on mobile as well as desktop.

> [!IMPORTANT]
> This repository is a portfolio prototype in active development. The browsing catalogue, cart, owner/admin views, order tracking, and checkout confirmation currently use demo/client-side data. The existing Express/Prisma API is a security-focused commerce foundation whose schema and seeded catalog still reflect an earlier product-store prototype. Food restaurant/menu/order records are not yet connected end-to-end to the database. Stripe services and Payment Element components exist, but the current food checkout does **not** create a PaymentIntent or take payment. See [Current scope](#current-scope-and-limitations) before evaluating the flow.

## Highlights

### Customer experience

- Restaurant discovery homepage with restaurant search, cuisine categories, promotions, and popular restaurants
- Searchable restaurant directory with cuisine filters and open/closed states
- Restaurant menu pages with categories, vegetarian labels, prices, and add-to-cart actions
- Same-restaurant cart protection to prevent accidental mixed orders
- Persisted cart state across refreshes using Zustand
- Customer authentication gate before checkout
- Delivery address form with name, phone, city, postal code, and delivery instructions
- Quantity controls, coupon application, tax, delivery fee, and order total calculation
- Order confirmation and tracking view
- Previous orders and reorder entry points

### Operations

- Dedicated owner/admin login entry pages that route through shared authentication
- Restaurant owner and platform admin dashboard UI prototypes
- Example incoming orders, menu availability controls, platform approval and management panels
- Dashboard actions are presentational and are not yet backed by role-protected food-management APIs

### Backend foundations

- Express REST API mounted under `/api`
- Prisma/PostgreSQL persistence layer for the existing prototype data model
- Password hashing with bcrypt
- HTTP-only authentication cookies
- CSRF protection and request validation
- Role-based authorization middleware
- Rate limiting and security headers
- Stripe PaymentIntent and webhook service foundation, not connected to the current food checkout
- Jest and Supertest coverage for auth, cart, checkout, security, products, and webhooks

## Product Walkthrough

```text
Browse restaurants
      |
Open a menu and add food
      |
Cart validates one restaurant per order
      |
Sign in or create a customer account
      |
Enter delivery location and instructions
      |
Review demo coupon, tax, delivery fee, and total
      |
Demo confirmation screen (no payment/order is created)
      |
Demo tracking view
```

## Screens and Routes

| Route | Purpose |
| --- | --- |
| `/` | Customer discovery homepage |
| `/restaurants` | Searchable restaurant directory |
| `/restaurants/olio-pizza` | Restaurant menu and cart actions |
| `/checkout` | Authenticated delivery checkout |
| `/orders` | Current and previous order tracking |
| `/login` | Customer login |
| `/register` | Customer registration |
| `/owner/login` | Restaurant partner login entry point |
| `/owner` | Restaurant operations dashboard |
| `/admin/login` | Platform administrator login entry point |
| `/admin` | Platform administration dashboard |

## Architecture

```text
Next.js client (:3000)
  ├── App Router pages
  ├── Zustand auth/cart stores
  ├── Responsive delivery UI
  └── REST API client

Express API (:4000)
  ├── Auth and role middleware
  ├── Cart and checkout services
  ├── Admin and user routes
  ├── Stripe payment service
  └── Validation, rate limiting, CSRF, security headers

PostgreSQL
  └── Prisma schema, seed script, relational models

Redis (optional in development)
  └── Sessions and rate-limit storage with in-memory fallback
```

See [`docs/architecture.md`](docs/architecture.md) for the implemented boundaries and planned food-ordering integration.

## Tech Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zustand, Lucide
- **Backend:** Node.js, Express 4, TypeScript, Zod
- **Database:** PostgreSQL, Prisma 5
- **Payments foundation:** Stripe PaymentIntents, Payment Element component, signed webhooks
- **Security:** bcrypt, HTTP-only cookies, CSRF, Helmet, rate limiting, role middleware
- **Testing:** Jest, Supertest, TypeScript checks
- **Infrastructure:** Docker Compose for PostgreSQL and Redis

## Local Development

### Requirements

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop, or local PostgreSQL and Redis
- Stripe test account only if experimenting with the existing API payment foundation

### Installation

```bash
git clone https://github.com/havek16/food-delivery-platform.git
cd food-delivery-platform
npm install
npm --prefix server install
npm --prefix client install
```

### Environment setup

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example server/.env
Copy-Item client/.env.example client/.env.local
```

macOS/Linux:

```bash
cp .env.example .env
cp .env.example server/.env
cp client/.env.example client/.env.local
```

Never commit `.env`, `server/.env`, or `client/.env.local`.

### Database and services

Start PostgreSQL (and optional Redis) using Docker Compose:

```bash
docker compose up -d
```

Generate Prisma client and apply the current prototype schema:

```bash
npm run db:generate
npm run db:push
```

The current Prisma schema/seed data is not the food restaurant/menu/order schema. The storefront demo does not require a populated database to browse, but database-backed food ordering is not complete yet.

`npm run db:seed` is available for the legacy commerce API prototype only. It does not create sample food restaurants. Set unique development seed passwords in `.env` before using it.

### Run the application

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API health check: http://localhost:4000/api/health

You can also run the processes separately:

```bash
npm run dev:server
npm run dev:client
```

## Environment Variables

The root `.env.example` contains server variables. Copy it to both `.env` (Prisma CLI) and `server/.env` (API). The client template is at `client/.env.example`; copy it to `client/.env.local`. Local environment files are excluded from Git.

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Access-token signing |
| `JWT_REFRESH_SECRET` | Refresh-token signing |
| `CSRF_SECRET` | CSRF cookie validation |
| `ENCRYPTION_KEY` | Encryption at rest |
| `STRIPE_SECRET_KEY` | Server-side Stripe API calls |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public Stripe.js/Elements key |
| `REDIS_URL` | Optional Redis session/rate-limit store |

## Stripe integration status

Stripe service code, webhook signature verification, and reusable Stripe Elements components are included as backend/frontend foundations. The current food checkout uses a demo confirmation state and does not mount Stripe Elements or persist a food order. Adding test keys alone will not turn on payment in the food UI.

For local webhook development when working on the existing Stripe API foundation, configure test keys in the ignored environment files and forward events with the Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
```

Use Stripe’s documented test cards only in Stripe Elements. Never collect or store card data in application inputs.

## Useful Commands

```bash
npm run typecheck       # Server and client TypeScript checks
npm run build           # Production server and client builds
npm test                # Backend test suite
npm run db:studio       # Prisma Studio
npm run db:seed         # Seed development data
```

## API overview

The API is mounted at `http://localhost:4000/api`. Current route groups include:

| Group | Examples | Domain |
| --- | --- | --- |
| Health/security | `GET /health`, `GET /csrf` | Service status and CSRF bootstrap |
| Auth | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` | User sessions and account security |
| Products | `/products`, `/products/:slug`, `/products/featured` | Legacy product catalogue, not restaurant menus |
| Cart | `/cart`, `/cart/items` | Legacy product cart API |
| Checkout | `/checkout/config`, `/checkout/session`, `/checkout/sync` | Existing commerce checkout foundation |
| Customer | `/me/orders`, `/me/addresses`, `/me/wishlist` | Existing account resources |
| Admin | `/admin/*` | Role-protected legacy catalog/order administration |
| Stripe webhook | `POST /webhooks/stripe` | Signed Stripe event receiver |

Use the route files in `server/src/routes/` as the source of truth; the food UI routes are not yet backed by matching restaurant/order APIs.

## Testing

Backend tests cover:

- Registration and login behavior
- Password and role authorization
- Cart quantity and total calculations
- Checkout validation
- Security middleware
- Stripe webhook handling
- Product filtering and API behavior

Run the full suite with:

```bash
npm test
```

## Demo Data

The storefront catalogue in `client/src/lib/demo-data.ts` contains five illustrative restaurants and menu items for browsing and cart demonstrations. The Prisma seed script still seeds legacy product-store data and development accounts; it does not seed food restaurants, food orders, or food reviews. Avoid using its default local passwords outside isolated development.

For a production ordering flow, restaurant/menu availability, address ownership, item pricing, coupon eligibility, order totals, payment status, and order transitions must be read/validated and persisted on the server.

## Current scope and limitations

| Area | Current state |
| --- | --- |
| Restaurant browsing and menu | Curated frontend demo data; search and cuisine filtering work locally |
| Cart | Persisted in browser storage; blocks adding items from a second restaurant |
| Sign-in and registration | Forms call the existing backend auth API; requires PostgreSQL schema and local seed/configuration |
| Delivery location | Checkout address fields; not a map/geolocation picker and not yet saved to a food-address API |
| Coupons and totals | Demo coupon/fee/tax calculations in the client; not authoritative for real checkout |
| Payment | Confirmation is simulated; Stripe UI/services are not connected to this food checkout |
| Orders and tracking | Example UI; food orders/status history are not persisted or live-updated |
| Owner/admin | Dashboard prototypes; food management actions and route-level food-role protection are not complete |
| Database | Existing Prisma schema is legacy commerce data, not food-delivery relational models |

These limits are explicit so the demo can be evaluated honestly. The roadmap below lists the integration work required to turn the prototype into a production-ready delivery service.

## Project Structure

```text
client/
  src/app/              Next.js routes and pages
  src/components/       Reusable UI and payment components
  src/lib/              API helpers, types, and demo catalogue
  src/stores/           Auth, cart, theme, and UI state
server/
  src/routes/           REST route definitions
  src/services/         Business logic and integrations
  src/middleware/       Auth, RBAC, validation, security
  tests/                Jest and Supertest suites
prisma/
  schema.prisma         Relational database schema
  seed.ts               Development seed data
docs/
  architecture.md       Implemented boundaries and planned integration
  demo-and-limitations.md Current behavior and remaining product work
```

## Roadmap

- Replace legacy product schema with restaurants, menus, carts, addresses, orders, payments, coupons, reviews, and status history
- Connect catalogue and restaurant dashboards to authenticated REST resources
- Recalculate cart totals and validate coupon/availability on the server
- Create orders and payment records transactionally; connect Stripe PaymentIntents and verified webhooks to food checkout
- Persist customer addresses, reviews, owner edits, and admin actions
- Add order status transition rules and live customer tracking
- Add restaurant image upload storage and automated deployment previews

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Please run type checks and tests before opening a pull request.

## Security

See [`SECURITY.md`](SECURITY.md) for private reporting. Do not open public issues for exploitable vulnerabilities.

## License

This project is available under the [MIT License](LICENSE).

---

Built as a full-stack portfolio project. Product UI lives in `client/`, API and tests in `server/`, persistence in `prisma/`.
