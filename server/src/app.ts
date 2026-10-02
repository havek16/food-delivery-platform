import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { securityHeaders, requestId, enforceHttps } from "./middleware/security";
import { ensureCsrfCookie, verifyCsrfToken } from "./middleware/csrf";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import { globalLimiter } from "./middleware/rateLimit";
import { env, corsOrigins, isProd } from "./config/env";
import { miscRoutes } from "./routes/misc.routes";
import { authRoutes } from "./routes/auth.routes";
import { productRoutes } from "./routes/product.routes";
import { cartRoutes } from "./routes/cart.routes";
import { userRoutes } from "./routes/user.routes";
import { adminRoutes } from "./routes/admin.routes";
import { checkoutRoutes } from "./routes/checkout.routes";
import { webhookRoutes } from "./routes/webhook.routes";

/**
 * Builds the Express application. Separated from the listener so Supertest can
 * exercise it directly without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  if (env.TRUST_PROXY || isProd) app.set("trust proxy", 1);

  app.use(requestId());
  app.use(securityHeaders());
  app.use(enforceHttps());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server / curl without an Origin header.
        if (!origin) return callback(null, true);
        const allowed = corsOrigins();
        const ok = allowed.includes(origin) || allowed.some((o) => origin.endsWith(`.${new URL(o).hostname}`));
        callback(ok ? null : new Error(`Origin ${origin} not allowed by CORS policy`), ok);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-XSRF-Token", "X-Request-ID"],
      exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
      maxAge: 86400,
    })
  );

  // Raw body for Stripe signatures — BEFORE the JSON parser. Bounded to 100kb.
  app.use("/webhooks", express.raw({ type: "application/json", limit: "100kb" }));

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "20kb" }));
  app.use(cookieParser());

  // CSRF bootstrap for all responses; verification for state-changing requests.
  app.use(ensureCsrfCookie());
  app.use(verifyCsrfToken());

  // Coarse per-client guard across the API surface.
  app.use(globalLimiter);

  // Misc / health / csrf (under /api so the client can use one base URL)
  app.use("/api", miscRoutes);

  // Public + B2C API
  app.use("/api/auth", authRoutes);
  app.use("/api", productRoutes);
  app.use("/api", cartRoutes);
  app.use("/api/me", userRoutes);
  app.use("/api", checkoutRoutes);
  app.use("/api/admin", adminRoutes);

  // Payment webhooks (raw body consumed above)
  app.use("/webhooks", webhookRoutes);

  app.use(notFoundHandler());
  app.use(errorHandler());

  return app;
}