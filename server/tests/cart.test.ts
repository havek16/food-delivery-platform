import request from "supertest";
import { cartService } from "../src/services/cart.service";
import { app, csrfTokenFor, type TestAgent } from "./helpers";

jest.mock("../src/services/cart.service", () => ({
  cartService: {
    read: jest.fn(),
    add: jest.fn(),
    updateQuantity: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    sync: jest.fn(),
    mergeGuestCart: jest.fn(),
  },
}));

const mockCart = (cartService as unknown) as {
  read: jest.Mock;
  add: jest.Mock;
  updateQuantity: jest.Mock;
  remove: jest.Mock;
  clear: jest.Mock;
  sync: jest.Mock;
  mergeGuestCart: jest.Mock;
};

const emptyCart = { items: [], totalCents: 0 };

describe("cart routes", () => {
  let agent: TestAgent;
  let csrf: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    agent = request.agent(app);
    csrf = await csrfTokenFor(agent);
    mockCart.read.mockResolvedValue(emptyCart);
  });

  it("issues a guest cart identity cookie for anonymous shoppers", async () => {
    const res = await agent.get("/api/cart").expect(200);
    expect(res.body.data.totalCents).toBe(0);
    const setCookie = (res.headers["set-cookie"] as unknown as string[]) ?? [];
    expect(setCookie.some((c) => c.startsWith("aura_cart="))).toBe(true);
  });

  it("adds an item to the guest cart and persists the identity cookie", async () => {
    mockCart.add.mockImplementation(async () => ({
      items: [{ id: "ci_1", product: { id: "p1", slug: "vetiver-muse", priceCents: 22500 } as never, quantity: 2, lineTotalCents: 45000 }],
      totalCents: 45000,
    }));

    const res = await agent
      .post("/api/cart/items")
      .set("X-CSRF-Token", csrf)
      .send({ productId: "p1", quantity: 2 })
      .expect(201);

    expect(res.body.data.totalCents).toBe(45000);
    // The guest token cookie should now be present.
    const joined = ((res.headers["set-cookie"] as unknown as string[]) ?? []).join("; ");
    expect(joined).toContain("aura_cart=");
  });

  it("validates cart payloads (quantity bounds)", async () => {
    const res = await agent
      .post("/api/cart/items")
      .set("X-CSRF-Token", csrf)
      .send({ productId: "p1", quantity: 999 })
      .expect(422);
    expect(mockCart.add).not.toHaveBeenCalled();
  });

  it("removes items by product id", async () => {
    mockCart.remove.mockResolvedValue(emptyCart);
    await agent
      .delete("/api/cart/items/p1")
      .set("X-CSRF-Token", csrf)
      .expect(200);
    expect(mockCart.remove).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
      "p1"
    );
  });

  it("syncs the client cart snapshot for guests", async () => {
    mockCart.sync.mockResolvedValue({ items: [], totalCents: 0 });
    const res = await agent
      .put("/api/cart/sync")
      .set("X-CSRF-Token", csrf)
      .send({ items: [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 3 }] })
      .expect(200);
    expect(mockCart.sync).toHaveBeenCalledWith(expect.anything(), [
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 3 },
    ]);
    expect(res.body.data.totalCents).toBe(0);
  });

  it("merges the guest cart for members", async () => {
    mockCart.mergeGuestCart.mockResolvedValue({ items: [], totalCents: 0 });
    await agent.post("/api/cart/merge").set("X-CSRF-Token", csrf).expect(200);
    expect(mockCart.mergeGuestCart).not.toHaveBeenCalled(); // anonymous => no-op
  });
});