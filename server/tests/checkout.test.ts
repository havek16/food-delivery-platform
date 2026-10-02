import request from "supertest";
import { checkoutService } from "../src/services/checkout.service";
import { stripeService } from "../src/services/stripe.service";
import { cartService } from "../src/services/cart.service";
import { app, csrfTokenFor, type TestAgent } from "./helpers";

jest.mock("../src/services/checkout.service", () => ({
  checkoutService: {
    createSession: jest.fn(),
    getPreparation: jest.fn(),
    retrieve: jest.fn(),
    markPaid: jest.fn(),
    handlePaymentIntentSucceeded: jest.fn(),
  },
}));

jest.mock("../src/services/stripe.service", () => ({
  stripeService: {
    createPaymentIntent: jest.fn(),
    constructWebhookEvent: jest.fn(),
    refund: jest.fn(),
    isConfigured: jest.fn(),
  },
}));

jest.mock("../src/services/cart.service", () => ({
  cartService: { sync: jest.fn() },
}));

const mockCheckout = (checkoutService as unknown) as {
  createSession: jest.Mock;
  getPreparation: jest.Mock;
};
const mockStripe = (stripeService as unknown) as { isConfigured: jest.Mock };

const validPayload = {
  guestEmail: "buyer@aura-essence.local",
  items: [{ productId: "p1", quantity: 2 }],
  shippingAddress: {
    firstName: "Ava",
    lastName: "Brooks",
    line1: "17 Amber Lane",
    city: "Chicago",
    state: "IL",
    postalCode: "60614",
    country: "US",
  },
};

describe("checkout routes", () => {
  let agent: TestAgent;
  let csrf: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    agent = request.agent(app);
    csrf = await csrfTokenFor(agent);
  });

  it("exposes Stripe bootstrap config (masked)", async () => {
    mockStripe.isConfigured.mockResolvedValue(false);
    const res = await agent.get("/api/checkout/config").expect(200);
    expect(res.body.data.configured).toBe(false);
    expect(res.body.data.currency).toBe("usd");
    expect(res.body.data).not.toHaveProperty("stripeSecretKey");
  });

  it("creates a payment session and returns only a client secret", async () => {
    mockCheckout.createSession.mockResolvedValue({
      checkoutId: "cs_abc123",
      paymentIntentId: "pi_xyz",
      clientSecret: "pi_xyz_secret_abc",
      totals: { subtotalCents: 45000, taxCents: 3600, shippingCents: 0, totalCents: 48600, currency: "usd" },
      expiresInSeconds: 3600,
    });

    const res = await agent
      .post("/api/checkout/session")
      .set("X-CSRF-Token", csrf)
      .send(validPayload)
      .expect(201);

    expect(res.body.data.clientSecret).toBe("pi_xyz_secret_abc");
    expect(res.body.data).not.toHaveProperty("card");
  });

  it("validates the checkout envelope strictly", async () => {
    const res = await agent
      .post("/api/checkout/session")
      .set("X-CSRF-Token", csrf)
      .send({ guestEmail: "not-an-email", items: [], shippingAddress: {} })
      .expect(422);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(mockCheckout.createSession).not.toHaveBeenCalled();
  });

  it("rate-limits session creation per client (Redis/in-memory window)", async () => {
    mockCheckout.createSession.mockImplementation(async () => ({
      checkoutId: "cs_xyz",
      paymentIntentId: "pi_xyz",
      clientSecret: "sec",
      totals: { subtotalCents: 1, taxCents: 0, shippingCents: 0, totalCents: 1, currency: "usd" },
      expiresInSeconds: 60,
    }));

    const attempts = 12;
    let got429 = false;
    for (let i = 0; i < attempts; i += 1) {
      const res = await agent
        .post("/api/checkout/session")
        .set("X-CSRF-Token", csrf)
        .send(validPayload);
      if (res.status === 429) {
        got429 = true;
        expect(res.headers["retry-after"]).toBeDefined();
        break;
      }
      expect(res.status).toBe(201);
    }
    expect(got429).toBe(true);
  });

  it("returns a checkout preparation preview for the success page", async () => {
    mockCheckout.getPreparation.mockResolvedValue({
      checkoutId: "cs_abc",
      status: "awaiting_payment",
      totals: { amount_cents: 48600, currency: "usd" },
      items: [],
    });
    const res = await agent.get("/api/checkout/session/cs_abc").expect(200);
    expect(res.body.data.checkoutId).toBe("cs_abc");
  });
});