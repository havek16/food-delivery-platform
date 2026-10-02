import type { NextFunction, Request, Response } from "express";
import { incrCounter } from "../config/redis";
import { HttpError } from "../utils/http";

export type RateLimitConfig = {
  /** bucket label appears in rate-limit response headers */
  name: string;
  limit: number;
  windowSeconds: number;
  /** identity used to build the bucket key (defaults to IP). */
  key?: (req: Request) => string;
};

/**
 * IP-based AND user-based rate limiting backed by Redis (in-memory fallback in
 * dev/tests). Sensitive endpoints (auth, checkout) mount their own buckets.
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identity =
      config.key?.(req) ??
      (req.user ? `user:${req.user?.id}` : `ip:${req.ip ?? req.socket.remoteAddress ?? "anon"}`);
    const key = `rl:${config.name}:${identity}`;
    const { count, ttlSeconds } = await incrCounter(key, config.windowSeconds);

    res.setHeader("X-RateLimit-Limit", String(config.limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, config.limit - count)));

    if (count > config.limit) {
      res.setHeader("Retry-After", String(ttlSeconds));
      return next(HttpError.tooManyRequests(
        `Slow down — too many attempts. Try again in ${ttlSeconds}s.`,
        "RATE_LIMITED",
        ttlSeconds
      ));
    }
    next();
  };
}

export const authLimiter = rateLimit({
  name: "auth",
  limit: 12,
  windowSeconds: 60,
  key: (req) => `ip:${req.ip ?? "anon"}`,
});

export const checkoutLimiter = rateLimit({
  name: "checkout",
  limit: 10,
  windowSeconds: 60,
  key: (req) => (req.user ? `user:${req.user?.id}` : `ip:${req.ip ?? "anon"}`),
});

export const globalLimiter = rateLimit({
  name: "global",
  limit: 200,
  windowSeconds: 60,
  key: (req) => (req.user ? `user:${req.user?.id}` : `ip:${req.ip ?? "anon"}`),
});