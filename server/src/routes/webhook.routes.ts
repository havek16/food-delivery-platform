import { Router } from "express";
import { stripeService } from "../services/stripe.service";
import { checkoutService } from "../services/checkout.service";
import { asyncHandler } from "../utils/http";
import { HttpError } from "../utils/http";
import { logger } from "../config/logger";

/**
 * Stripe webhooks — mounted on a RAW body parser so signature verification has
 * the exact bytes Stripe signed. CSRF is intentionally skipped: authenticity is
 * established by `Stripe-Signature` + `STRIPE_WEBHOOK_SECRET`.
 */
export const webhookRoutes = Router();

webhookRoutes.post(
  "/stripe",
  asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature) throw HttpError.badRequest("Missing Stripe signature", "BAD_SIGNATURE");

    let event;
    try {
      event = await stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      logger.warn("webhook:signature_invalid", { error: (err as Error).message });
      throw HttpError.unauthorized("Invalid webhook signature", "INVALID_SIGNATURE");
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as { id: string };
        const { order, replayed } = await checkoutService.handlePaymentIntentSucceeded(pi.id);
        res.json({ received: true, orderNumber: order.orderNumber, replayed });
        return;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as { id: string; metadata?: { checkoutId?: string } };
        const checkoutId = pi.metadata?.checkoutId;
        logger.warn("webhook:payment_failed", { paymentIntentId: pi.id, checkoutId });
        res.json({ received: true });
        return;
      }
      case "charge.refunded": {
        logger.info("webhook:charge_refunded", { id: (event.data.object as { id: string }).id });
        res.json({ received: true });
        return;
      }
      default:
        res.json({ received: true });
    }
  })
);