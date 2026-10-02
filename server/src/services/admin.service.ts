import { OlfactoryFamily, Concentration, GenderCategory, ProductType, Role, UserStatus, OrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";
import { randomToken } from "../utils/crypto";
import { hashPassword, isValidPassword } from "../utils/password";
import { auditService } from "./audit.service";
import { orderService } from "./order.service";
import { stripeService } from "./stripe.service";

export type AdminActor = { id: string; role: string };

export const adminService = {
  // ---------------------------------------------------------------------------
  // Products (MANAGER / SUPERADMIN)
  // ---------------------------------------------------------------------------
  async createProduct(
    input: {
      slug: string;
      name: string;
      tagline: string;
      description: string;
      family: OlfactoryFamily;
      concentration: Concentration;
      gender: GenderCategory;
      type?: ProductType;
      priceCents: number;
      stock: number;
      sizeMl?: number;
      isFeatured?: boolean;
      notes?: { note: string; position: "TOP" | "HEART" | "BASE"; intensity: number }[];
    },
    actor: AdminActor,
    ip?: string
  ) {
    const exists = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (exists) throw HttpError.conflict("Product slug already exists", "SLUG_TAKEN");

    const product = await prisma.product.create({
      data: {
        slug: input.slug,
        name: input.name,
        tagline: input.tagline,
        description: input.description,
        family: input.family,
        concentration: input.concentration,
        gender: input.gender,
        type: input.type ?? "SINGLE",
        priceCents: input.priceCents,
        stock: input.stock,
        sizeMl: input.sizeMl ?? 100,
        isFeatured: input.isFeatured ?? false,
        notes: input.notes?.length
          ? {
              create: await linkNotes(input.notes),
            }
          : undefined,
      },
    });

    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "product.create",
      category: "catalog",
      entityType: "product",
      entityId: product.id,
      ip,
      detail: { slug: product.slug, name: product.name, priceCents: product.priceCents },
    });
    return product;
  },

  async updateProduct(
    productId: string,
    input: Record<string, unknown>,
    actor: AdminActor,
    ip?: string
  ) {
    const existing = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...input,
        // Never accept mutable nested note edges directly here; manage separately.
        notes: undefined,
      },
    });
    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "product.update",
      category: "catalog",
      entityType: "product",
      entityId: productId,
      ip,
      sensitive: { changedFields: Object.keys(input as object) },
    });
    return updated;
  },

  async setProductNotes(
    productId: string,
    notes: { note: string; position: "TOP" | "HEART" | "BASE"; intensity: number }[],
    actor: AdminActor,
    ip?: string
  ) {
    await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    await prisma.productNote.deleteMany({ where: { productId } });
    const created = await prisma.productNote.createMany({
      data: await linkNotes(notes, productId),
    });
    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "product.notes_update",
      category: "catalog",
      entityType: "product",
      entityId: productId,
      ip,
      detail: { noteCount: created.count },
    });
    return { noteCount: created.count };
  },

  async deleteProduct(productId: string, actor: AdminActor, ip?: string) {
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "product.deactivate",
      category: "catalog",
      entityType: "product",
      entityId: productId,
      ip,
    });
    return { ok: true };
  },

  // ---------------------------------------------------------------------------
  // Orders (MANAGER / SUPERADMIN)
  // ---------------------------------------------------------------------------
  listOrders: orderService.adminList,
  getOrder: orderService.getById,
  updateOrderStatus: orderService.updateStatus,

  async refundOrder(orderId: string, reason: string, actor: AdminActor, ip?: string) {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    if (!order.stripePaymentIntentId) {
      throw HttpError.badRequest("Order has no payment to refund", "NO_PAYMENT_INTENT");
    }
    await stripeService.refund(order.stripePaymentIntentId, "requested_by_customer");
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    });
    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "order.refund",
      category: "orders",
      entityType: "order",
      entityId: orderId,
      result: "success",
      ip,
      sensitive: { reason, totalCents: order.totalCents },
    });
    return updated;
  },

  /** Retry a checkout whose charge succeeded but session expired/order failed. */
  async reconcileOrder(orderNumber: string) {
    // Look up existing order by a payment-associated number via full scan fallback.
    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (order) return order;
    throw HttpError.notFound("No order found to reconcile", "ORDER_NOT_FOUND");
  },

  // ---------------------------------------------------------------------------
  // Users (SUPERADMIN only)
  // ---------------------------------------------------------------------------
  async listUsers(query: { page: number; pageSize: number; role?: Role; search?: string }) {
    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search ? { OR: [{ email: { contains: query.search, mode: "insensitive" as const } }, { firstName: { contains: query.search, mode: "insensitive" as const } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, mfaEnabled: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

  async setUserStatus(userId: string, status: UserStatus, actor: AdminActor, ip?: string) {
    if (userId === actor.id && status === "SUSPENDED") {
      throw HttpError.badRequest("You cannot suspend your own account", "SELF_ACTION");
    }
    const updated = await prisma.user.update({ where: { id: userId }, data: { status } });
    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "user.status_change",
      category: "users",
      entityType: "user",
      entityId: userId,
      ip,
      sensitive: { status, targetEmail: updated.email },
    });
    return { id: updated.id, status: updated.status };
  },

  async setUserRole(userId: string, role: Role, actor: AdminActor, ip?: string) {
    if (role === "SUPERADMIN" && actor.role !== "SUPERADMIN") {
      throw HttpError.forbidden("Only a SuperAdmin can grant SuperAdmin", "INSUFFICIENT_ROLE");
    }
    if (userId === actor.id && role !== actor.role) {
      throw HttpError.badRequest("Use your own account carefully — you cannot demote yourself via this API", "SELF_ACTION");
    }
    const updated = await prisma.user.update({ where: { id: userId }, data: { role } });
    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "user.role_change",
      category: "users",
      entityType: "user",
      entityId: userId,
      ip,
      sensitive: { role, targetEmail: updated.email },
    });
    return { id: updated.id, role: updated.role };
  },

  async createStaffUser(
    input: { email: string; firstName: string; lastName: string; role: Role; password?: string },
    actor: AdminActor,
    ip?: string
  ) {
    const email = input.email.toLowerCase().trim();
    const password = input.password ?? randomToken(18) + "Aa1!";
    if (!isValidPassword(password)) {
      throw HttpError.unprocessable("Password does not meet strength policy", "WEAK_PASSWORD");
    }
    const created = await prisma.user.create({
      data: {
        email,
        emailVerified: true,
        passwordHash: await hashPassword(password),
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        cartToken: randomToken(16),
      },
    });
    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "user.staff_create",
      category: "users",
      entityType: "user",
      entityId: created.id,
      ip,
      sensitive: { email, role: created.role },
    });
    return {
      id: created.id,
      email: created.email,
      role: created.role,
      // One-time password — the only time this is revealed.
      temporaryPassword: password,
    };
  },

  async auditLogs(query: { limit?: number; offset?: number; action?: string }) {
    return auditService.list(query);
  },
};

/** @internal resolves note names -> their ids (lazily creating the note). */
async function linkNotes(
  notes: { note: string; position: "TOP" | "HEART" | "BASE"; intensity: number }[],
  productId?: string
) {
  const edges: { productId?: string; noteId: string; position: string; intensity: number }[] = [];
  for (const n of notes) {
    const row = await prisma.olfactoryNote.upsert({
      where: { name: n.note },
      update: {},
      create: { name: n.note, family: "WOODY" },
    });
    edges.push({
      productId,
      noteId: row.id,
      position: n.position,
      intensity: n.intensity,
    });
  }
  return edges as { productId: string; noteId: string; position: "TOP" | "HEART" | "BASE"; intensity: number }[];
}

export function parseStatus(value: unknown): OrderStatus | undefined {
  const list: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
  return list.includes(value as OrderStatus) ? (value as OrderStatus) : undefined;
}