import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { ApiError } from "../utils/http";
import { logger } from "../config/logger";

/**
 * Central error handler:
 *  - validation errors => 422 with readable, non-internal details
 *  - known ApiErrors => their status/code
 *  - anything else => masked 500 in production (no stack traces leaked)
 * Audit-worthy failures (auth) are logged here as structured entries.
 */
export function notFoundHandler() {
  return (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
    });
  };
}

export function errorHandler() {
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      const readable = fromZodError(err).message;
      res.status(422).json({
        success: false,
        error: { code: "VALIDATION", message: readable, issues: err.issues },
      });
      return;
    }

    if (err instanceof ApiError) {
      res.status(err.status).json({
        success: false,
        error: { code: err.code, message: err.message, details: err.details },
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") {
      logger.error("unhandled:error", { error: message, stack: err instanceof Error ? err.stack : undefined, path: req.path });
    } else {
      // Mask internal details; keep a correlation id in logs.
      logger.error("unhandled:error", {
        error: message,
        requestId: req.requestId,
        path: req.path,
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: "Internal server error",
      },
    });
  };
}