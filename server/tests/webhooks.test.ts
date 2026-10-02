import request from "supertest";
import { stripeService } from "../src/services/stripe.service";
import { checkoutService } from "../src/services/checkout.service";
import { app } from "./helpers";

jest.mock("../src/services/stripe.service", () => ({
  stripeService: {
    createPaymentIntent: jest.fn(),
    constructWebhookEvent: jest.fn(),
    refund: jest.fn(),
    isConfigured: jest.fn(),
  },
}));

jest.mock("../src/services/checkout.service", () => ({
  checkoutService: {
    createSession: jest.fn(),
    getPreparation: jest.fn(),
    retrieve: jest.fn(),
    markPaid: jest.fn(),
    handlePaymentIntentSucceeded: jest.fn(),
  },
}));

const mockStripe = (stripeService as unknown) as { constructWebhookEvent: jest.Mock };
const mockCheckout = (checkoutService as unknown) as { handlePaymentIntentSucceeded: jest.Mock };

const RAW_BODY = JSON.stringify({ id: "evt_123", type: "payment_intent.succeeded", object: { id: "pi_123" } });

describe("stripe webhooks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects payloads without a signature", async () => {
    const res = await request(app)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(RAW_BODY)
      .expect(400);
    expect(res.body.error.code).toBe("BAD_SIGNATURE");
  });

  it("rejects payloads with an invalid signature", async () => {
    mockStripe.constructWebhookEvent.mockRejectedValueOnce(new Error("No signatures found"));
    const res = await request(app)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", "t=1,v1=forged")
      .send(RAW_BODY)
      .expect(401);
    expect(res.body.error.code).toBe("INVALID_SIGNATURE");
  });

  it("fulfils the order transactionally for payment_intent.succeeded", async () => {
    mockStripe.constructWebhookEvent.mockResolvedValueOnce({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });
    mockCheckout.handlePaymentIntentSucceeded.mockResolvedValueOnce({
      order: { orderNumber: "AE-ABC12345", id: "o_1" },
      replayed: false,
    });

    const res = await request(app)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", "t=1,v1=valid")
      .send(RAW_BODY)
      .expect(200);

    expect(res.body).toMatchObject({ received: true, orderNumber: "AE-ABC12345", replayed: false });
    expect(mockStripe.constructWebhookEvent).toHaveBeenCalledTimes(1);
  });

  it("acknowledges (idempotently) a replayed success event", async () => {
    mockStripe.constructWebhookEvent.mockResolvedValueOnce({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });
    mockCheckout.handlePaymentIntentSucceeded.mockResolvedValueOnce({
      order: { orderNumber: "AE-ABC12345", id: "o_1" },
      replayed: true,
    });
    const res = await request(app)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", "t=1,v1=valid")
      .send(RAW_BODY)
      .expect(200);
    expect(res.body.replayed).toBe(true);
  });
});