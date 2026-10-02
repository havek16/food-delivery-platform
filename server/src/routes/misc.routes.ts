import { Router } from "express";
import { asyncHandler, ok } from "../utils/http";
import { makeCsrfToken, isCsrfTokenValid } from "../middleware/csrf";
import { env } from "../config/env";
import { pingRedis } from "../config/redis";

export const miscRoutes = Router();

miscRoutes.get("/health", asyncHandler(async (req, res) => {
  const redis = await pingRedis();
  ok(res, {
    status: "ok",
    uptime: process.uptime(),
    redis: redis ? "connected" : "in-memory-fallback",
  });
}));

/** Explicit CSRF bootstrap for SPAs that prefer not to read cookies directly. */
miscRoutes.get("/csrf", asyncHandler(async (req, res) => {
  const existing = req.cookies?.[env.CSRF_COOKIE_NAME];
  const valid = existing !== undefined && isCsrfTokenValid(existing);
  if (valid) {
    ok(res, { csrfToken: existing });
    return;
  }
  const token = makeCsrfToken();
  res.cookie(env.CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "strict",
    secure: env.COOKIE_SECURE || env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60 * 1000,
  });
  ok(res, { csrfToken: token });
}));