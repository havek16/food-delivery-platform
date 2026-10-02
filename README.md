# Table & Tomato

Table & Tomato is a full-stack food delivery product for neighborhood restaurants. It includes a polished customer storefront, persistent cart, checkout flow, restaurant operations dashboard, admin overview, authentication infrastructure, Prisma persistence, and Stripe test-mode integration points.

## Stack

- Next.js 15 and React 19 client in `client/`
- Express and TypeScript API in `server/`
- PostgreSQL and Prisma in `prisma/`
- Zustand for client cart state
- Stripe PaymentIntents and verified webhook structure

## Run locally

```bash
npm install
npm --prefix server install
npm --prefix client install
copy .env.example server/.env
copy client/.env.example client/.env.local
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Docker users can run `docker compose up -d` before the database commands. On macOS/Linux, use `cp` instead of `copy`.

## Routes

- `/` customer home and discovery
- `/restaurants` searchable and filterable restaurant listing
- `/restaurants/olio-pizza` menu and cart actions
- `/checkout` address, coupon, payment, and order confirmation
- `/orders` current and previous order tracking
- `/owner` restaurant order and menu operations view
- `/admin` platform management overview

## Environment

Copy `.env.example` to `server/.env`. Never put Stripe secret keys or database credentials in `client/.env.local`. Stripe test cards should be used only with `STRIPE_SECRET_KEY=sk_test_...`; raw card numbers are not stored by the application.

## Test accounts

Seed credentials are controlled through environment variables. Use a customer account for `/orders`, the restaurant owner account for `/owner`, and the admin account for `/admin`. Change all development passwords before deploying.

## API architecture

The Express API is mounted under `/api` with separate auth, product/cart, checkout, user, admin, and webhook routers. Authentication uses hashed passwords, HTTP-only session cookies, CSRF protection, validation middleware, rate limiting, and role middleware. The customer-facing food catalog is currently backed by the curated demo dataset in `client/src/lib/demo-data.ts`; the next production milestone is wiring restaurant, menu, order, coupon, and review resources to Prisma.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

The repository intentionally excludes `node_modules`, `.next`, server build output, local environment files, logs, and database volumes.
