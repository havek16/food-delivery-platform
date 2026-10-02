import type { NextFunction, Request, Response } from "express";

/**
 * Async route handler wrapper — forwards rejections to the central error
 * middleware so Express 4 never silently drops them.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly expose: boolean;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code ?? `HTTP_${status}`;
    this.expose = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const HttpError = {
  badRequest: (msg = "Bad request", code = "BAD_REQUEST", details?: unknown) =>
    new ApiError(400, msg, code, details),
  unauthorized: (msg = "Unauthorized", code = "UNAUTHORIZED", details?: unknown) =>
    new ApiError(401, msg, code, details),
  forbidden: (msg = "Forbidden", code = "FORBIDDEN", details?: unknown) =>
    new ApiError(403, msg, code, details),
  notFound: (msg = "Not found", code = "NOT_FOUND", details?: unknown) =>
    new ApiError(404, msg, code, details),
  conflict: (msg = "Conflict", code = "CONFLICT", details?: unknown) =>
    new ApiError(409, msg, code, details),
  unprocessable: (msg = "Unprocessable entity", code = "UNPROCESSABLE", details?: unknown) =>
    new ApiError(422, msg, code, details),
  tooManyRequests: (msg = "Too many requests", code = "RATE_LIMITED", retryAfterSeconds?: number) =>
    new ApiError(429, msg, code, { retryAfterSeconds }),
  internal: (msg = "Internal server error", code = "INTERNAL", details?: unknown) =>
    new ApiError(500, msg, code, details),
};

export function ok<T>(res: Response, data: T, meta: Record<string, unknown> = {}, status = 200) {
  res.status(status).json({ success: true, data, meta });
}

export function created<T>(res: Response, data: T, meta: Record<string, unknown> = {}) {
  return ok(res, data, meta, 201);
}

export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return ok(
    res,
    items,
    { total, page, pageSize, pages: pageSize > 0 ? Math.ceil(total / pageSize) : 0 },
    200
  );
}

export type Pagination = { page: number; pageSize: number; skip: number; take: number };

export function parsePagination(query: Record<string, unknown>): Pagination {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 24) || 24));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}