# Demo behavior and limitations

This note distinguishes working prototype interactions from backend capabilities. It is intended to make local evaluation and technical review straightforward.

## What can be tried in the browser

- Browse five sample restaurants and view their menus.
- Search/filter the restaurant listing by restaurant name and cuisine.
- Add menu items to a persisted browser cart; the cart prevents mixing restaurants.
- Open customer login/register pages and see role-specific owner/admin login entry points.
- Enter a delivery address in checkout and see the client-side form validation.
- See the example owner/admin dashboards and sample tracking layout.

## What is currently a prototype

- The sample food catalogue lives in `client/src/lib/demo-data.ts`; it is not read from the database.
- Checkout totals and the `WELCOME10` example coupon are client-side demonstration logic.
- Food checkout confirmation clears the browser cart and displays sample order details. It does not charge a card or create a durable order.
- The tracking page and owner/admin dashboards use sample content. Their actions do not update food-order records.
- Delivery address entry is a text form, not address autocomplete, geolocation, or a saved-address workflow.
- The Prisma schema, seed data, and existing product/cart/checkout API are from a legacy product-commerce prototype; they do not define food restaurants, menus, delivery orders, or reviews.
- Stripe API services, webhook verification, and Stripe Elements components exist, but the current food checkout is not connected to them.

## Recommended evaluation setup

The customer browsing prototype runs with only the frontend. The API additionally requires a PostgreSQL database and valid server environment values. The API seed script seeds the legacy commerce schema, not the food demo dataset. Set your own local seed account passwords and use test-only Stripe keys when working on payment integration.

## Production completion checklist

1. Replace the legacy Prisma commerce models and seed data with food-delivery entities.
2. Add authenticated restaurant/menu/address/order/coupon/review APIs and connect the client to them.
3. Recalculate every item price, coupon, tax, and delivery charge on the server.
4. Add restaurant-specific role authorization and validate every order-status transition.
5. Create a payment record and Stripe PaymentIntent for each checkout; verify webhook signatures and handle replay/idempotency.
6. Persist order status history and provide polling or server-sent events for tracking.
7. Add integration tests that exercise registration through payment, fulfillment, delivery, and review.
