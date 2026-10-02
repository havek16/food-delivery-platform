import type { NextFunction, Request, Response } from "express";
import helmet, { type HelmetOptions } from "helmet";
import { env, isProd } from "../config/env";
import { randomUUID } from "crypto";

/**
 * HTTP security headers suite (Helmet) tailored for a JSON API.
 * CSP is locked down — the API never serves HTML.
 */
const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: { action: "deny" },
  noSniff: true,
  hidePoweredBy: true,
  xDownloadOptions: false,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
};

export function securityHeaders() {
  return helmet(helmetOptions);
}

/** Attach a request id for correlation across logs and audit entries. */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers["x-request-id"] as string) ?? randomUUID();
    req.requestId = id;
    res.setHeader("x-request-id", id);
    next();
  };
}

/**
 * Enforce HTTPS in production (unless behind a proxy that terminates TLS).
 * Real HSTS is handled by Helmet; this middleware rejects plain-HTTP requests
 * when COOKIE_SECURE is set and the connection is not secure.
 */
export function enforceHttps() {
  return (req: Request, res: Response, next: NextFunction) => {
    const secureRequest = req.secure || req.headers["x-forwarded-proto"] === "https";
    if (isProd && !secureRequest) {
      res.status(403).json({ success: false, error: { code: "HTTPS_REQUIRED" } });
      return;
    }
    next();
  };
}