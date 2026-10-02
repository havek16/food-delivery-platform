import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http";

export type Role = "USER" | "MANAGER" | "SUPERADMIN";

/**
 * Role-Based Access Control.
 * Usage: router.post("/admin/products", requireAuth(), requireRoles("MANAGER", "SUPERADMIN"), ...)
 */
export function requireRoles(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!req.user) return next(HttpError.unauthorized("Authentication required", "NO_ACCESS_TOKEN"));
    if (!role || !allowed.includes(role as Role)) {
      return next(
        HttpError.forbidden(`Requires role: ${allowed.join(" or ")}`, "INSUFFICIENT_ROLE")
      );
    }
    next();
  };
}

export const MANAGER_ROLES: Role[] = ["MANAGER", "SUPERADMIN"];
export const SUPERADMIN_ONLY: Role[] = ["SUPERADMIN"];