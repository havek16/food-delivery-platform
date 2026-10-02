import { Router } from "express";
import { userService } from "../services/user.service";
import { wishlistService } from "../services/wishlist.service";
import { orderService } from "../services/order.service";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, ok, paginated, parsePagination } from "../utils/http";
import { validateBody, validateParams } from "../middleware/validate";
import { addressSchema, idParamSchema } from "./schemas";

export const userRoutes = Router();

userRoutes.use(requireAuth());

userRoutes.get("/dashboard", asyncHandler(async (req, res) => {
  const data = await userService.dashboard(req.user!.id);
  ok(res, data);
}));

// ---------------------------------------------------------------------------
// Orders (own)
// ---------------------------------------------------------------------------
userRoutes.get("/orders", asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query as unknown as Record<string, unknown>);
  const result = await orderService.forUser(req.user!.id, pagination);
  paginated(res, result.items, result.total, pagination.page, pagination.pageSize);
}));

userRoutes.get("/orders/:id", validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const order = await orderService.getForUser(req.params.id, req.user!.id);
  ok(res, { order });
}));

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
userRoutes.get("/wishlist", asyncHandler(async (req, res) => {
  const items = await wishlistService.list(req.user!.id);
  ok(res, items);
}));

userRoutes.put("/wishlist/:id", validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const items = await wishlistService.add(req.user!.id, req.params.id);
  ok(res, items);
}));

userRoutes.delete("/wishlist/:id", validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const items = await wishlistService.remove(req.user!.id, req.params.id);
  ok(res, items);
}));

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
userRoutes.get("/addresses", asyncHandler(async (req, res) => {
  const items = await userService.listAddresses(req.user!.id);
  ok(res, items);
}));

userRoutes.post("/addresses", validateBody(addressSchema), asyncHandler(async (req, res) => {
  const item = await userService.addAddress(req.user!.id, req.body);
  ok(res, { address: item }, {}, 201);
}));

userRoutes.patch("/addresses/:id", validateParams(idParamSchema), validateBody(addressSchema.partial().strict()), asyncHandler(async (req, res) => {
  const item = await userService.updateAddress(req.user!.id, req.params.id, req.body);
  ok(res, { address: item });
}));

userRoutes.delete("/addresses/:id", validateParams(idParamSchema), asyncHandler(async (req, res) => {
  await userService.deleteAddress(req.user!.id, req.params.id);
  ok(res, { deleted: true });
}));