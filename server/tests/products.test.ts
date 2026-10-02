import request from "supertest";
import { productService, type ProductDTO } from "../src/services/product.service";
import { quizService } from "../src/services/quiz.service";
import { HttpError } from "../src/utils/http";
import { app, csrfTokenFor } from "./helpers";

jest.mock("../src/services/product.service", () => ({
  productService: {
    list: jest.fn(),
    getBySlug: jest.fn(),
    featured: jest.fn(),
    notesIndex: jest.fn(),
    related: jest.fn(),
    findByIds: jest.fn(),
  },
}));

jest.mock("../src/services/quiz.service", () => ({
  quizService: { score: jest.fn(), explore: jest.fn() },
}));

const mockProducts = (productService as unknown) as {
  list: jest.Mock;
  getBySlug: jest.Mock;
  featured: jest.Mock;
  notesIndex: jest.Mock;
  related: jest.Mock;
};

const fakeProduct: ProductDTO = {
  id: "p_1",
  slug: "noir-lumiere",
  name: "Noir Lumière",
  tagline: "Light folding through midnight",
  description: "A nocturnal glimmer of saffron over smoked oud.",
  brand: "Aura & Essence",
  family: "ORIENTAL",
  concentration: "PARFUM",
  gender: "UNISEX",
  type: "SINGLE",
  priceCents: 38500,
  sizeMl: 100,
  stock: 14,
  inStock: true,
  isFeatured: true,
  images: [],
  notes: { top: ["Saffron"], heart: ["Oud"], base: ["Amber"] },
};

describe("products catalog", () => {
  it("lists products with pagination metadata", async () => {
    mockProducts.list.mockResolvedValue({ items: [fakeProduct], total: 1 });
    const res = await request(app).get("/api/products").expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ total: 1, page: 1, pageSize: 24 });
  });

  it("rejects unknown olfactive family values (enum validation)", async () => {
    const res = await request(app).get("/api/products?family=GOURMAND").expect(422);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(mockProducts.list).not.toHaveBeenCalled();
  });

  it("passes validated filters through to the service", async () => {
    mockProducts.list.mockResolvedValue({ items: [], total: 0 });
    await request(app).get("/api/products?family=WOODY&concentration=EDP&priceMin=20000&sort=price_asc").expect(200);
    const [arg] = mockProducts.list.mock.calls[0] as [unknown];
    expect(arg).toMatchObject({ family: "WOODY", concentration: "EDP", priceMin: 20000, sort: "price_asc" });
  });

  it("returns a single product with its related suggestions", async () => {
    mockProducts.getBySlug.mockResolvedValue(fakeProduct);
    mockProducts.related.mockResolvedValue([fakeProduct]);
    const res = await request(app).get("/api/products/noir-lumiere").expect(200);
    expect(res.body.data.product.slug).toBe("noir-lumiere");
    expect(res.body.data.related).toHaveLength(1);
  });

  it("maps a soft 404 for unknown products", async () => {
    mockProducts.getBySlug.mockRejectedValue(HttpError.notFound("Product not found", "PRODUCT_NOT_FOUND"));
    const res = await request(app).get("/api/products/does-not-exist").expect(404);
    expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("lists the olfactory notes index", async () => {
    mockProducts.notesIndex.mockResolvedValue([{ id: "n1", name: "Oud", family: "WOODY", intensity: 90, productCount: 2 }]);
    const res = await request(app).get("/api/products/notes").expect(200);
    expect(res.body.data[0].name).toBe("Oud");
  });

  it("scores the signature-scent quiz when the payload is valid", async () => {
    (quizService.score as jest.Mock).mockResolvedValue([{ product: fakeProduct, score: 88, reasons: ["x"] }]);
    const agent = request.agent(app);
    const csrf = await csrfTokenFor(agent);
    const res = await agent
      .post("/api/products/quiz")
      .set("X-CSRF-Token", csrf)
      .send({ families: ["ORIENTAL"], notes: ["Vanilla Bourbon", "Oud"], occasion: "evening" })
      .expect(200);
    expect(res.body.data[0].score).toBe(88);
  });

  it("rejects quiz payloads with unknown occasion values", async () => {
    const agent = request.agent(app);
    const csrf = await csrfTokenFor(agent);
    const res = await agent
      .post("/api/products/quiz")
      .set("X-CSRF-Token", csrf)
      .send({ occasion: "lunch" })
      .expect(422);
    expect(res.body.error.code).toBe("VALIDATION");
  });
});