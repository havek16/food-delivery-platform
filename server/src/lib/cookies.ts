import type { CookieOptions, Response } from "express";
import { env } from "../config/env";

export const ACCESS_COOKIE = "aura_access";
export const REFRESH_COOKIE = env.REFRESH_COOKIE_NAME;
export const CSRF_COOKIE = env.CSRF_COOKIE_NAME;

const secure = env.COOKIE_SECURE || env.NODE_ENV === "production";

const base: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure,
  domain: env.COOKIE_DOMAIN,
};

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE, token, {
    ...base,
    path: "/api",
    maxAge: env.JWT_ACCESS_TTL_SECONDS * 1000,
  });
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...base,
    path: "/api",
    maxAge: env.REFRESH_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: "/api" });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: "/api" });
}

/**
 * CSRF cookie is deliberately NOT HttpOnly (the client must read it to echo in
 * the X-CSRF-Token header). Token is signed with the server secret so it can be
 * validated without a store.
 */
export function setCsrfCookie(res: Response, token: string) {
  res.cookie(CSRF_COOKIE, token, {
    ...base,
    httpOnly: false,
    path: "/",
    maxAge: 12 * 60 * 60 * 1000,
  });
}

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false, path: "/" });
}