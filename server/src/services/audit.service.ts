import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { encryptJson } from "../utils/crypto";
import { logger } from "../config/logger";

export type AuditEntry = {
  actorId?: string | null;
  actorRole?: "USER" | "MANAGER" | "SUPERADMIN" | null;
  action: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  result?: "success" | "failure";
  ip?: string;
  userAgent?: string;
  detail?: Record<string, unknown>;
  /** Sensitive payload — encrypted at rest, never serialized to logs. */
  sensitive?: Record<string, unknown>;
};

/**
 * Structured audit logging for administrative actions and failed logins.
 * Sensitive detail is encrypted at rest (AES-256-GCM). Writes are fire-and-forget
 * so a broken audit pipeline never blocks the request it describes.
 */
export const auditService = {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          actorRole: entry.actorRole ?? null,
          action: entry.action,
          category: entry.category ?? "general",
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          result: entry.result ?? "success",
          ipAddress: entry.ip ? truncateIp(entry.ip) : null,
          userAgent: entry.userAgent ? entry.userAgent.slice(0, 500) : null,
          detail: entry.detail ? (entry.detail as Prisma.InputJsonValue) : undefined,
          detailEncrypted: entry.sensitive ? encryptJson(entry.sensitive) : null,
        },
      });
    } catch (err) {
      logger.warn("audit:write-failed", { action: entry.action, error: (err as Error).message });
    }
  },

  async list(query: { limit?: number; offset?: number; action?: string }) {
    const limit = Math.min(200, query.limit ?? 100);
    const where = query.action ? { action: query.action } : {};
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: query.offset ?? 0,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  },
};

/** Mask the final octet(s) of an IPv4/IPv6 address before persistence. */
function truncateIp(ip: string): string {
  try {
    if (ip.includes(":")) {
      const parts = ip.split(":");
      return `${parts.slice(0, Math.max(1, parts.length - 1)).join(":")}:****`;
    }
    return ip.split(".").slice(0, 3).concat("***").join(".");
  } catch {
    return ip;
  }
}