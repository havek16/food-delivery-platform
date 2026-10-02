import { env } from "../config/env";
import { getJson, setJson } from "../config/redis";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";
import { randomToken } from "../utils/crypto";
import { stripeService } from "./stripe.service";
import { orderService, type OrderItemInput } from "./order.service";
import { notifyService } from "./notify.service";
import { auditService } from "./audit.service";

export type CheckoutLine = {
  productId: string;
  quantity: number;
};

export type CheckoutSession = {
  id: string;
  userId?: string;
  guestEmail?: string;
  items: (OrderItemInput & { stockAtSession: number })[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
  paymentIntentId?: string;
  orderNumber?: string;
  status: "awaiting_payment" | "paid" | "failed" | "declined";
  createdAt: number;
  notes?: string;
};

const TTL = 60 * 60; // one hour to finish payment

function money(cents: number, currency: string) {
  return { amount_cents: cents, currency };
}

/**
 * 1. Re-validates the client payload against the database (ignores client-supplied
 * prices — prices come from the DB) and confirms inventory.
 * 2. Stores an immutable snapshot in Redis ("the offer").
 * 3. Creates the Stripe PaymentIntent for exactly the server-computed total.
 */
export const checkoutService = {
  async createSession(input: {
    userId?: string;
    guestEmail?: string;
    items: CheckoutLine[];
    shippingAddress: Record<string, unknown>;
    billingAddress?: Record<string, unknown>;
    notes?: string;
  }) {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw HttpError.badRequest("Cart is empty", "EMPTY_CART");
    }

    const ids = [...new Set(input.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items: CheckoutSession["items"] = [];
    for (const line of input.items) {
      const product = byId.get(line.productId);
      if (!product) throw HttpError.notFound("A product in your cart no longer exists", "PRODUCT_REMOVED");
      const qty = Math.min(24, Math.max(1, Math.floor(line.quantity || 1)));
      if (product.stock < qty) {
        throw HttpError.conflict(`"${product.name}" has only ${product.stock} in stock`, "INSUFFICIENT_STOCK", {
          available: product.stock,
        });
      }
      items.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        concentration: product.concentration,
        sizeMl: product.sizeMl,
        unitPriceCents: product.priceCents, // server price only
        quantity: qty,
        stockAtSession: product.stock,
      });
    }

    const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
    const taxCents = Math.round((subtotalCents * env.TAX_RATE_PERCENT) / 100);
    const shippingCents =
      subtotalCents >= env.FREE_SHIPPING_THRESHOLD_CENTS ? 0 : env.SHIPPING_FLAT_CENTS;
    const totalCents = subtotalCents + taxCents + shippingCents;
    const currency = env.STRIPE_CURRENCY;

    const checkoutId = randomToken(18);
    const session: CheckoutSession = {
      id: checkoutId,
      userId: input.userId,
      guestEmail: input.guestEmail?.toLowerCase().trim(),
      items,
      subtotalCents,
      taxCents,
      shippingCents,
      totalCents,
      currency,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress ?? input.shippingAddress,
      status: "awaiting_payment",
      createdAt: Date.now(),
      notes: input.notes,
    };

    const paymentIntent = await stripeService.createPaymentIntent({
      amountCents: totalCents,
      currency,
      checkoutId,
      customerEmail: session.guestEmail ?? undefined,
    });
    session.paymentIntentId = paymentIntent.id;

    await setJson(`checkout:${checkoutId}`, session, TTL);

    return {
      checkoutId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      totals: { subtotalCents, taxCents, shippingCents, totalCents, currency },
      expiresInSeconds: TTL,
    };
  },

  async getPreparation(checkoutId: string) {
    const session = await getJson<CheckoutSession>(`checkout:${checkoutId}`);
    if (!session) throw HttpError.notFound("Checkout session not found or expired", "CHECKOUT_EXPIRED");
    return {
      checkoutId: session.id,
      status: session.status,
      totals: money(session.totalCents, session.currency),
      items: session.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        lineTotalCents: i.unitPriceCents * i.quantity,
      })),
    };
  },

  async retrieve(checkoutId: string): Promise<CheckoutSession | null> {
    return getJson<CheckoutSession>(`checkout:${checkoutId}`);
  },

  async markPaid(checkoutId: string, orderNumber: string) {
    const session = await this.retrieve(checkoutId);
    if (!session) return null;
    session.status = "paid";
    session.orderNumber = orderNumber;
    await setJson(`checkout:${checkoutId}`, session, TTL);
    return session;
  },

  /** Stripe webhook entry: payment_intent.succeeded */
  async handlePaymentIntentSucceeded(paymentIntentId: string) {
    // Idempotency: an order already exists for this intent.
    const existing = await orderService.findByPaymentIntent(paymentIntentId);
    if (existing) return { order: existing, replayed: true };

    // We use metadata.checkoutId set at intent creation.
    // Fall back to checkoutId key => read session directly.
    const fallback = await this.retrieve(paymentIntentId);
    const session = fallback && fallback.paymentIntentId === paymentIntentId ? fallback : null;
    if (!session) {
      // A session older than TTL — we still want to honour the charge. Rather
      // than guess, flag for manual reconciliation.
      await auditService.log({
        action: "checkout.orphan_payment",
        category: "payments",
        entityType: "payment_intent",
        entityId: paymentIntentId,
        result: "failure",
        sensitive: { reason: "checkout_session_missing" },
      });
      throw HttpError.conflict("Checkout session missing for payment", "CHECKOUT_MISSING");
    }

    try {
      const order = await orderService.createFromCheckout({
        userId: session.userId,
        guestEmail: session.guestEmail,
        items: session.items,
        subtotalCents: session.subtotalCents,
        taxCents: session.taxCents,
        shippingCents: session.shippingCents,
        totalCents: session.totalCents,
        currency: session.currency,
        shippingAddress: session.shippingAddress,
        billingAddress: session.billingAddress,
        paymentIntentId,
        notes: session.notes,
      });

      await this.markPaid(session.id, order.orderNumber);

      // Automatic receipt generation (ops stub — wire your email provider in
      // notify.service). Never logs payment card data.
      await notifyService.sendOrderReceipt(order, session.guestEmail);

      await auditService.log({
        action: "order.created",
        category: "orders",
        entityType: "order",
        entityId: order.id,
        detail: { orderNumber: order.orderNumber, totalCents: order.totalCents },
      });

      return { order, replayed: false };
    } catch (err) {
      // Inventory may have changed between intent creation and charge success.
      // Refund automatically so the customer is never double-billed.
      if (err instanceof Error && err.message.includes("INSUFFICIENT_STOCK")) {
        await stripeService.refund(paymentIntentId, "requested_by_customer");
        await auditService.log({
          action: "checkout.refunded_out_of_stock",
          category: "payments",
          entityType: "payment_intent",
          entityId: paymentIntentId,
          result: "failure",
          detail: { message: err.message },
        });
        if (session.userId) {
          await prisma.cartItem.deleteMany({
            where: { userId: session.userId, productId: { in: session.items.map((i) => i.productId) } },
          });
        }
      }
      throw err;
    }
  },
};

export { money };