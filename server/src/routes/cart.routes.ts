import { Router } from "express";
import { cartService } from "../services/cart.service";
import { optionalAuth } from "../middleware/auth";
import { asyncHandler, ok } from "../utils/http";
import { validateBody, validateParams } from "../middleware/validate";
import { cartItemSchema, cartUpdateSchema, cartSyncSchema, idParamSchema } from "./schemas";
import { randomToken } from "../utils/crypto";

export const CART_COOKIE = "aura_cart";

/**
 * Guest cart identity cookie. Logged-in carts are keyed by userId; guest carts
 * by this safe random token (used only as a DB lookup key).
 */
export function ensureGuestCart() {
  return (req: any, res: any, next: any) => {
    if (!req.cookies?.[CART_COOKIE]) {
      res.cookie(CART_COOKIE, randomToken(18), {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/api",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    next();
  };
}

function cartContext(req: { user?: { id: string }; cookies?: Record<string, string | undefined> }) {
  return {
    userId: req.user?.id,
    cartToken: req.cookies?.[CART_COOKIE],
  };
}

export const cartRoutes = Router();

cartRoutes.use(ensureGuestCart());

cartRoutes.get(
  "/cart",
  optionalAuth(),
  asyncHandler(async (req, res) => {
    const cart = await cartService.read(cartContext(req));
    ok(res, cart);
  })
);

cartRoutes.post(
  "/cart/items",
  optionalAuth(),
  validateBody(cartItemSchema),
  asyncHandler(async (req, res) => {
    const cart = await cartService.add(cartContext(req), req.body);
    ok(res, cart, {}, 201);
  })
);

cartRoutes.patch(
  "/cart/items/:id",
  optionalAuth(),
  validateParams(idParamSchema),
  validateBody(cartUpdateSchema),
  asyncHandler(async (req, res) => {
    const cart = await cartService.updateQuantity(cartContext(req), req.params.id, req.body.quantity);
    ok(res, cart);
  })
);

cartRoutes.delete(
  "/cart/items/:id",
  optionalAuth(),
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const cart = await cartService.remove(cartContext(req), req.params.id);
    ok(res, cart);
  })
);

cartRoutes.put(
  "/cart/sync",
  optionalAuth(),
  validateBody(cartSyncSchema),
  asyncHandler(async (req, res) => {
    const cart = await cartService.sync(cartContext(req), req.body.items);
    ok(res, cart);
  })
);

cartRoutes.delete(
  "/cart",
  optionalAuth(),
  asyncHandler(async (req, res) => {
    const cart = await cartService.clear(cartContext(req));
    ok(res, cart);
  })
);

cartRoutes.post(
  "/cart/merge",
  optionalAuth(),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      // no-op for guests
      const cart = await cartService.read(cartContext(req));
      return ok(res, cart);
    }
    const cart = await cartService.mergeGuestCart(req.user.id);
    ok(res, cart);
  })
);