import type { Prisma } from "@prisma/client";
import { Stripe } from "stripe";
import { env, isProd } from "../config/env";
import { HttpError } from "../utils/http";
import { logger } from "../config/logger";

/**
 * Stripe integration — Payment Intents + webhook signature verification.
 *
 * PCI-DSS compliant by design: raw card data is collected and tokenised by
 * Stripe Elements in the browser; the server never touches a PAN, CVC or
 * expiry date. Webhooks are verified with `STRIPE_WEBHOOK_SECRET`.
 */
let _stripe: Stripe | null = null;

function stripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw HttpError.internal("Stripe is not configured on this server", "STRIPE_NOT_CONFIGURED");
  }
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
  }
  return _stripe;
}

export type IntentPayload = {
  amountCents: number;
  currency: string;
  checkoutId: string;
  orderNumber?: string;
  customerEmail?: string;
  customerId?: string;
};

export const stripeService = {
  async createPaymentIntent(payload: IntentPayload) {
    if (!env.STRIPE_SECRET_KEY) {
      // Development ergonomics: allow checkout to be exercised end-to-end with a
      // synthetic client secret when payments aren't configured. Production
      // refuses loudly instead.
      if (isProd) {
        throw HttpError.internal("Stripe is not configured on this server", "STRIPE_NOT_CONFIGURED");
      }
      return {
        id: `pi_demo_${payload.checkoutId}`,
        clientSecret: `demo_${payload.checkoutId}`,
        amount: payload.amountCents,
        currency: payload.currency,
      };
    }
    const params: Stripe.PaymentIntentCreateParams = {
      amount: payload.amountCents,
      currency: payload.currency,
      automatic_payment_methods: { enabled: true },
      metadata: { checkoutId: payload.checkoutId, orderNumber: payload.orderNumber ?? "" },
      receipt_email: payload.customerEmail,
    };
    if (payload.customerId) params.customer = payload.customerId;
    const pi = await stripe().paymentIntents.create(params);
    return { id: pi.id, clientSecret: pi.client_secret, amount: pi.amount, currency: pi.currency };
  },

  async constructWebhookEvent(body: string | Buffer, signature: string): Promise<Stripe.Event> {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw HttpError.internal("Webhook secret not configured", "WEBHOOK_NOT_CONFIGURED");
    }
    return stripe().webhooks.constructEvent(
      typeof body === "string" ? Buffer.from(body) : body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  },

  async refund(paymentIntentId: string, reason?: string) {
    const pi = await stripe().paymentIntents.retrieve(paymentIntentId);
    if (pi.amount_received <= 0) {
      // Nothing captured — cancel instead.
      return stripe().paymentIntents.cancel(paymentIntentId);
    }
    const refundReason: "duplicate" | "fraudulent" | "requested_by_customer" | undefined =
      reason === "duplicate" || reason === "fraudulent" ? reason : "requested_by_customer";
    return stripe().refunds.create({ payment_intent: paymentIntentId, reason: refundReason });
  },

  async isConfigured(): Promise<boolean> {
    return Boolean(env.STRIPE_SECRET_KEY);
  },
};

void logger;