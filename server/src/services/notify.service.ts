import { logger } from "../config/logger";

/**
 * Receipt / transactional email generation.
 *
 * This is the integration point for SES, Resend, Postmark, etc. The automatic
 * receipt is generated from order data after the Stripe webhook confirms the
 * payment. PII is only sent over to the provider — never logged in full.
 */
export const notifyService = {
  async sendPasswordResetEmail(input: { email: string; token: string }) {
    const resetUrl = `https://aura-essence.app/reset-password?token=${input.token}`;
    logger.info("email.password_reset", { sentTo: mask(input.email) });
    // TODO(prod): `await resend.emails.send({ to: input.email, subject: "Reset
    // your Aura & Essence password", html: renderPasswordReset(resetUrl) })`
    return { sent: true };
  },

  async sendOrderReceipt(order: { orderNumber: string; totalCents: number }, email?: string | null) {
    const receipt = {
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      sentTo: email ? mask(email) : "guest (no email on record)",
    };
    logger.info("receipt.generated", receipt);
    // TODO(prod): `await resend.emails.send({ to: email, subject: "Your Aura &
    // Essence receipt", html: renderReceipt(order) })`
    return { receiptId: crypto.randomUUID(), orderNumber: order.orderNumber };
  },
};

function mask(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 1)}***@${domain}`;
}