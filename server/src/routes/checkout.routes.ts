import { Router } from "express";
import { optionalAuth } from "../middleware/auth";
import { checkoutLimiter } from "../middleware/rateLimit";
import { checkoutService } from "../services/checkout.service";
import { stripeService } from "../services/stripe.service";
import { cartService } from "../services/cart.service";
import { asyncHandler, ok } from "../utils/http";
import { validateBody } from "../middleware/validate";
import { checkoutSchema } from "./schemas";
import { env } from "../config/env";

export const checkoutRoutes = Router();

// Public config so the client can bootstrap Stripe Elements.
checkoutRoutes.get("/checkout/config", asyncHandler(async (req, res) => {
  const configured = await stripeService.isConfigured();
  ok(res, {
    configured,
    currency: env.STRIPE_CURRENCY,
    taxRatePercent: env.TAX_RATE_PERCENT,
    freeShippingThresholdCents: env.FREE_SHIPPING_THRESHOLD_CENTS,
    shippingFlatCents: env.SHIPPING_FLAT_CENTS,
  });
}));

checkoutRoutes.post(
  "/checkout/session",
  optionalAuth(),
  checkoutLimiter,
  validateBody(checkoutSchema),
  asyncHandler(async (req, res) => {
    const result = await checkoutService.createSession({
      userId: req.user?.id,
      guestEmail: req.body.guestEmail ?? req.user?.email,
      items: req.body.items,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress,
      notes: req.body.notes,
    });
    ok(res, result, {}, 201);
  })
);

// Order-summary preview shown on the success page (avoids a DB hit before webhook).
checkoutRoutes.get("/checkout/session/:id", asyncHandler(async (req, res) => {
  const preparation = await checkoutService.getPreparation(req.params.id);
  ok(res, preparation);
}));

checkoutRoutes.post(
  "/checkout/sync",
  optionalAuth(),
  validateBody(checkoutSchema.pick({ items: true })),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      const context = { userId: undefined, cartToken: req.cookies?.["aura_cart"] };
      const cart = await cartService.sync(context, req.body.items);
      return ok(res, cart);
    }
    const cart = await cartService.sync({ userId: req.user.id }, req.body.items);
    ok(res, cart);
  })
);