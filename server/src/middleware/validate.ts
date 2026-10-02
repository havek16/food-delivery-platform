import type { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { HttpError } from "../utils/http";

/**
 * Request payload validation & sanitization.
 * Schemas defined in zod are the single trust boundary for all input.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(result.error);
    req.query = result.data as Request["query"];
    next();
  };
}

export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return next(result.error);
    req.params = result.data as Request["params"];
    next();
  };
}

/** Normalizes user-supplied free text: trims, collapses whitespace, strips control chars. */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function requireBody(body: unknown): asserts body is Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw HttpError.badRequest("Expected a JSON object body", "INVALID_BODY");
  }
}