import { Router } from "express";
import { productService } from "../services/product.service";
import { quizService } from "../services/quiz.service";
import { parsePagination, asyncHandler, ok, paginated } from "../utils/http";
import { validateQuery, validateBody, validateParams } from "../middleware/validate";
import { productQuerySchema, quizSchema, slugParamSchema, exploreQuerySchema } from "./schemas";
import type { OlfactoryFamily, Concentration, GenderCategory, ProductType } from "@prisma/client";

type CleanQuery = {
  q?: string;
  family?: OlfactoryFamily;
  concentration?: Concentration;
  gender?: GenderCategory;
  type?: ProductType;
  note?: string;
  inStock?: boolean;
  featured?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "featured";
};

export const productRoutes = Router();

productRoutes.get(
  "/products",
  validateQuery(productQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as CleanQuery;
    const pagination = parsePagination(req.query as unknown as Record<string, unknown>);
    const result = await productService.list(query, pagination);
    paginated(res, result.items, result.total, pagination.page, pagination.pageSize);
  })
);

productRoutes.get(
  "/products/featured",
  asyncHandler(async (req, res) => {
    const items = await productService.featured();
    ok(res, items);
  })
);

productRoutes.get(
  "/products/notes",
  asyncHandler(async (req, res) => {
    const index = await productService.notesIndex();
    ok(res, index);
  })
);

productRoutes.post(
  "/products/quiz",
  validateBody(quizSchema),
  asyncHandler(async (req, res) => {
    const results = await quizService.score(req.body);
    ok(res, results);
  })
);

productRoutes.get(
  "/products/explore",
  validateQuery(exploreQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await quizService.explore(req.query.note as string);
    ok(res, result);
  })
);

productRoutes.get(
  "/products/:slug",
  validateParams(slugParamSchema),
  asyncHandler(async (req, res) => {
    const product = await productService.getBySlug(req.params.slug);
    const related = await productService.related(req.params.slug);
    ok(res, { product, related });
  })
);