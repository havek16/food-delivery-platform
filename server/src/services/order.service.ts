import { Prisma, OrderStatus, Concentration } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";
import { auditService } from "./audit.service";

export type OrderItemInput = {
  productId: string;
  productName: string;
  productSlug: string;
  concentration: string;
  sizeMl: number;
  unitPriceCents: number;
  quantity: number;
};

export type CreateOrderInput = {
  userId?: string;
  guestEmail?: string;
  items: OrderItemInput[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
  paymentIntentId: string;
  notes?: string;
};

export function readableOrderNumber(seed: string): string {
  return `AE-${seed.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8)}`;
}

/**
 * Creates a PAID order inside a serializable transaction that decrements stock
 * atomically. Idempotent per Stripe PaymentIntent (unique constraint), so a
 * replayed webhook can never double-charge or double-ship.
 */
export async function createOrderFromCheckout(input: CreateOrderInput) {
  const orderNumber = readableOrderNumber(input.paymentIntentId);

  const order = await prisma.$transaction(
    async (tx) => {
      // Lock product rows to serialise inventory decrements.
      const products = await tx.$queryRaw<
        Array<{ id: string; priceCents: number; stock: number }>
      >`SELECT id, "priceCents", stock FROM "Product" WHERE id IN (${Prisma.join(input.items.map((i) => i.productId))}) FOR UPDATE`;

      const stockById = new Map(products.map((p) => [p.id, p.stock]));

      // Verify stock against the payments-worth of quantity.
      const insufficient = input.items.find(
        (i) => (stockById.get(i.productId) ?? 0) < i.quantity
      );
      if (insufficient) {
        const available = stockById.get(insufficient.productId) ?? 0;
        throw HttpError.conflict(
          `"${insufficient.productName}" is no longer available (${available} left)`,
          "INSUFFICIENT_STOCK",
          { available }
        );
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId ?? null,
          guestEmail: input.guestEmail ?? null,
          status: OrderStatus.PAID,
          paymentStatus: "SUCCEEDED",
          subtotalCents: input.subtotalCents,
          taxCents: input.taxCents,
          shippingCents: input.shippingCents,
          totalCents: input.totalCents,
          currency: input.currency,
          shippingAddress: input.shippingAddress as Prisma.InputJsonValue,
          billingAddress: input.billingAddress as Prisma.InputJsonValue,
          stripePaymentIntentId: input.paymentIntentId,
          notes: input.notes ?? null,
          fulfilledAt: new Date(),
items: {
              create: input.items.map((i) => ({
                productId: i.productId,
                productName: i.productName,
                productSlug: i.productSlug,
                concentration: i.concentration as Concentration,
                sizeMl: i.sizeMl,
                unitPriceCents: i.unitPriceCents,
                quantity: i.quantity,
              })),
            },
        },
      });

      // Decrement stock.
      await Promise.all(
        input.items.map((i) =>
          tx.product.update({
            where: { id: i.productId },
            data: { stock: { decrement: i.quantity } },
          })
        )
      );

      // Drop fulfilled cart rows.
      if (input.userId) {
        await tx.cartItem.deleteMany({ where: { userId: input.userId, productId: { in: input.items.map((i) => i.productId) } } });
      }

      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 }
  );

  return { ...order };
}

export const orderService = {
  createFromCheckout: createOrderFromCheckout,

  async forUser(userId: string, pagination: { skip: number; take: number }) {
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { items, total };
  },

  async getForUser(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw HttpError.notFound("Order not found", "ORDER_NOT_FOUND");
    return order;
  },

  async getById(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw HttpError.notFound("Order not found", "ORDER_NOT_FOUND");
    return order;
  },

  async findByPaymentIntent(paymentIntentId: string) {
    return prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
  },

  async adminList(query: { status?: OrderStatus; skip: number; take: number }) {
    const where = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.take,
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  },

  async updateStatus(
    orderId: string,
    nextStatus: OrderStatus,
    actor: { id: string; role: string },
    ip?: string
  ) {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const prev = order.status;
    const data: Prisma.OrderUpdateInput = { status: nextStatus };
    if (nextStatus === "DELIVERED") data.deliveredAt = new Date();
    const updated = await prisma.order.update({ where: { id: orderId }, data });

    await auditService.log({
      actorId: actor.id,
      actorRole: actor.role as "USER" | "MANAGER" | "SUPERADMIN",
      action: "order.status_update",
      category: "orders",
      entityType: "order",
      entityId: order.id,
      ip,
      detail: { prev, next: nextStatus, orderNumber: order.orderNumber },
    });
    return updated;
  },

  async countForUser(userId: string) {
    return prisma.order.count({ where: { userId } });
  },
};