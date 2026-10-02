# Architecture

## System map

```text
Browser
  └── Next.js App Router (client:3000)
      ├── Restaurant demo catalogue: client/src/lib/demo-data.ts
      ├── Browser-persisted Zustand cart and auth UI state
      └── REST helper: client/src/lib/api.ts ──────────────┐
                                                           │
                                                           ▼
                                      Express API (server:4000)
                                        ├── Auth and session routes
                                        ├── Product/cart/checkout routes
                                        ├── Admin/user routes
                                        └── Stripe service + webhook route
                                                           │
                                                           ▼
                                      PostgreSQL / Prisma (legacy commerce schema)
                                      Redis (optional; memory fallback)
```

## Current boundaries

The food storefront is a frontend prototype. Restaurant cards and menus are loaded from a curated TypeScript data module, and the cart is persisted in browser storage. The current food checkout validates required address fields and renders a demo confirmation; it does not call the checkout API, create a database order, or initiate a Stripe PaymentIntent.

The Express API is a separate security-focused commerce foundation. It provides authentication, validation, CSRF protections, rate limiting, existing product/cart/checkout services, admin APIs, and Stripe service/webhook handling. The Prisma model currently represents a legacy product-store domain rather than food restaurants and menus. The owner/admin food dashboards are presentation prototypes and are not connected to API management routes.

## Security and request lifecycle

For API calls that change state, the client API helper requests a CSRF token and sends it with credentials. The Express application applies request identifiers, security headers, CORS, parsing limits, CSRF verification, and request limiting before mounting resource routers. Route handlers validate request payloads and delegate business operations to service modules. Authentication uses hashed passwords and HTTP-only cookies; role middleware protects the API routes that require privileged access. Stripe webhooks use a raw request body and signature verification.

Those protections apply to the existing API. They do not turn the food demo UI into a secure ordering system: food prices, discounts, restaurant availability, order lifecycle, and payment state need server-side implementation before launch.

## Client state

| Store | Responsibility |
| --- | --- |
| `auth` | Locally persisted view of the current signed-in user |
| `cart` | Browser-persisted restaurant selection, menu items, and quantities |
| `drawer`, `theme`, `wishlist`, `quiz` | Independent presentation or legacy feature state |

## Target food-ordering model

The production data model should include users/roles, restaurant ownership, restaurants, menu categories/items/options, saved addresses, carts, orders/order items, payment records, coupons, reviews, and order status history. Price and coupon validation must happen server-side. A successful Stripe webhook—not a browser redirect—should be the source of truth for payment status, with order status transitions recorded transactionally.
