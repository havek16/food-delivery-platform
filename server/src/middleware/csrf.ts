import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { env } from "../config/env";
import { setCsrfCookie } from "../lib/cookies";
import { HttpError } from "../utils/http";

/**
 * Double-submit CSRF protection.
 *
 * - GET responses ensure a signed CSRF cookie exists (non-HttpOnly, SameSite=strict).
 * - Every state-changing request (POST/PUT/PATCH/DELETE) must echo the same token
 *   via the `X-CSRF-Token` header. The signature binding to CSRF_SECRET prevents
 *   cookie-setting by foreign origins from producing a valid token.
 *
 * Stripe webhooks are exempt (they arrive with a different signature scheme and
 * are processed on the raw-body route before this middleware).
 */

function sign(token: string): string {
  return crypto.createHmac("sha256", env.CSRF_SECRET).update(token).digest("base64url");
}

export function makeCsrfToken(): string {
  const nonce = crypto.randomBytes(24).toString("base64url");
  return `${nonce}.${sign(nonce)}`;
}

export function isCsrfTokenValid(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const [nonce, sig] = token.split(".");
  if (!nonce || !sig) return false;
  const expected = sign(nonce);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Ensure the signed CSRF cookie is present on every response. */
export function ensureCsrfCookie() {
  return (req: Request, res: Response, next: NextFunction) => {
    const existing = req.cookies?.[env.CSRF_COOKIE_NAME] as string | undefined;
    if (!existing || existing.split(".").length !== 2) {
      setCsrfCookie(res, makeCsrfToken());
    }
    next();
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_PREFIXES = ["/webhooks"];

/** Reject state-changing requests without a matching CSRF token. */
export function verifyCsrfToken() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Stripe webhooks carry Stripe's own signature scheme — no CSRF token.
    if (CSRF_EXEMPT_PREFIXES.some((p) => req.originalUrl.startsWith(p))) return next();
    if (SAFE_METHODS.has(req.method)) return next();
    const cookie = req.cookies?.[env.CSRF_COOKIE_NAME] as string | undefined;
    const header = (req.headers["x-csrf-token"] ?? req.headers["x-xsrf-token"]) as string | undefined;
    if (!cookie || !header || cookie !== header || !isCsrfTokenValid(cookie)) {
      return next(HttpError.forbidden("Invalid or missing CSRF token", "CSRF_FAILED"));
    }
    next();
  };
}