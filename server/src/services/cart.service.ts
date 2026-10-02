import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";
import { toProductDTO, type ProductDTO } from "./product.service";

export type CartContext = {
  userId?: string;
  cartToken?: string;
};

export type CartItemDTO = {
  id: string;
  product: ProductDTO;
  quantity: number;
  lineTotalCents: number;
};

export function cartKey(context: CartContext): { userId?: string; cartToken?: string } {
  return {
    userId: context.userId,
    cartToken: context.cartToken,
  };
}

const MAX_QUANTITY = 24;

export const cartService = {
  async read(context: CartContext): Promise<{ items: CartItemDTO[]; totalCents: number }> {
    const where: Prisma.CartItemWhereInput = context.userId
      ? { userId: context.userId }
      : { cartToken: context.cartToken };

    if (context.userId) {
      // If the user has no server cart yet, fall back to any guest cart so a
      // freshly logged-in user sees their pre-login items.
      if (!context.cartToken && (await prisma.cartItem.count({ where })) === 0) {
        return { items: [], totalCents: 0 };
      }
    }

    const rows = await prisma.cartItem.findMany({
      where,
      include: { product: { include: { notes: { include: { note: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    const items: CartItemDTO[] = rows.map((r) => ({
      id: r.id,
      product: toProductDTO(r.product),
      quantity: r.quantity,
      lineTotalCents: r.quantity * r.product.priceCents,
    }));
    return {
      items,
      totalCents: items.reduce((s, i) => s + i.lineTotalCents, 0),
    };
  },

  async add(context: CartContext, input: { productId: string; quantity: number }) {
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.floor(input.quantity || 1)));
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product || !product.isActive) throw HttpError.notFound("Product not found", "PRODUCT_NOT_FOUND");
    if (product.stock < quantity) {
      throw HttpError.conflict(`Only ${product.stock} in stock`, "INSUFFICIENT_STOCK", { available: product.stock });
    }

    const key = { userId: context.userId ?? null, cartToken: context.userId ? null : (context.cartToken ?? null) };
    if (!key.userId && !key.cartToken) {
      throw HttpError.badRequest("Cart identity required", "NO_CART_TOKEN");
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        ...(key.userId
          ? { userId_productId: { userId: key.userId, productId: product.id } }
          : { cartToken_productId: { cartToken: key.cartToken!, productId: product.id } }),
      },
    });

    if (existing) {
      const nextQty = Math.min(MAX_QUANTITY, existing.quantity + quantity);
      if (product.stock < nextQty) {
        throw HttpError.conflict(`Only ${product.stock} in stock`, "INSUFFICIENT_STOCK", { available: product.stock });
      }
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQty } });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: key.userId,
          cartToken: key.cartToken,
          productId: product.id,
          quantity,
        },
      });
    }
    return this.read(context);
  },

  async updateQuantity(context: CartContext, productId: string, quantity: number) {
    const qty = Math.min(MAX_QUANTITY, Math.max(0, Math.floor(quantity)));
    const target = await this.findOwnedItem(context, productId);
    if (qty === 0) return this.remove(context, productId);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    if (product.stock < qty) {
      throw HttpError.conflict(`Only ${product.stock} in stock`, "INSUFFICIENT_STOCK", { available: product.stock });
    }
    await prisma.cartItem.update({ where: { id: target.id }, data: { quantity: qty } });
    return this.read(context);
  },

  async remove(context: CartContext, productId: string) {
    const target = await this.findOwnedItem(context, productId);
    await prisma.cartItem.delete({ where: { id: target.id } });
    return this.read(context);
  },

  async clear(context: CartContext) {
    if (context.userId) await prisma.cartItem.deleteMany({ where: { userId: context.userId } });
    else if (context.cartToken) await prisma.cartItem.deleteMany({ where: { cartToken: context.cartToken } });
    return { items: [], totalCents: 0 };
  },

  /** Merge the guest cart (user.cartToken) into the user cart after login. */
  async mergeGuestCart(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.cartToken) return this.read({ userId });
    const guestItems = await prisma.cartItem.findMany({ where: { cartToken: user.cartToken } });
    for (const g of guestItems) {
      const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId: g.productId } },
      });
      const qty = Math.min(MAX_QUANTITY, (existing?.quantity ?? 0) + g.quantity);
      if (existing) {
        await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: qty } });
      } else {
        await prisma.cartItem.create({ data: { userId, productId: g.productId, quantity: g.quantity } });
      }
    }
    await prisma.cartItem.deleteMany({ where: { cartToken: user.cartToken } });
    return this.read({ userId });
  },

  /** Client-authoritative replace (empty = clear). Used for guest carts. */
  async sync(context: CartContext, items: { productId: string; quantity: number }[]) {
    const key = { userId: context.userId ?? null, cartToken: context.userId ? null : (context.cartToken ?? null) };
    if (!key.userId && !key.cartToken) throw HttpError.badRequest("Cart identity required", "NO_CART_TOKEN");

    const where: Prisma.CartItemWhereInput = key.userId ? { userId: key.userId } : { cartToken: key.cartToken };
    await prisma.cartItem.deleteMany({ where });

    const products = items.length
      ? await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));

    const create = items.flatMap((i) => {
      const product = byId.get(i.productId);
      if (!product || !product.isActive) return [];
      const qty = Math.min(MAX_QUANTITY, Math.max(0, Math.floor(i.quantity || 0)));
      if (qty === 0 || product.stock < qty) return [];
      return [
        {
          userId: key.userId,
          cartToken: key.cartToken,
          productId: product.id,
          quantity: qty,
        },
      ];
    });

    if (create.length) {
      await prisma.cartItem.createMany({ data: create });
    }
    return this.read(context);
  },

  async findOwnedItem(context: CartContext, productId: string) {
    const item = context.userId
      ? await prisma.cartItem.findUnique({ where: { userId_productId: { userId: context.userId, productId } } })
      : await prisma.cartItem.findUnique({ where: { cartToken_productId: { cartToken: context.cartToken!, productId } } });
    if (!item) throw HttpError.notFound("Item not in cart", "CART_ITEM_NOT_FOUND");
    return item;
  },
};