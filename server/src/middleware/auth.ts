import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";
import { HttpError } from "../utils/http";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../lib/cookies";

/**
 * Access token is read from the HttpOnly cookie `aura_access` or the
 * `Authorization: Bearer` header. Never from localStorage.
 */
function readAccessToken(req: Request): string | null {
  const fromCookie = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export { REFRESH_COOKIE };

/** Populates req.user when a valid access token is present (never throws). */
export function optionalAuth() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = readAccessToken(req);
    if (!token) return next();
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as "USER" | "MANAGER" | "SUPERADMIN",
        sessionId: payload.sid,
      };
      req.isAuthed = true;
    } catch (err) {
      // Suspended sessions / expired tokens are simply treated as anonymous.
      const noise = err instanceof jwt.JsonWebTokenError;
      if (noise) {
        // ignore — optional auth degrades gracefully
      }
    }
    next();
  };
}

/** Requires a valid access token. */
export function requireAuth() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = readAccessToken(req);
    if (!token) return next(HttpError.unauthorized("Authentication required", "NO_ACCESS_TOKEN"));
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as "USER" | "MANAGER" | "SUPERADMIN",
        sessionId: payload.sid,
      };
      req.isAuthed = true;
      return next();
    } catch (err) {
      const expired = err instanceof jwt.TokenExpiredError;
      return next(
        HttpError.unauthorized(
          expired ? "Session expired" : "Invalid access token",
          expired ? "ACCESS_TOKEN_EXPIRED" : "INVALID_ACCESS_TOKEN"
        )
      );
    }
  };
}

/** Strictly rejects users that are banned/suspended (checked at session materialization). */
export function requireActiveUser() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(HttpError.unauthorized("Authentication required"));
    next();
  };
}