import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";
import { toProductDTO, type ProductDTO } from "./product.service";

export const wishlistService = {
  async list(userId: string): Promise<ProductDTO[]> {
    const rows = await prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { notes: { include: { note: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toProductDTO(r.product));
  },

  async add(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw HttpError.notFound("Product not found", "PRODUCT_NOT_FOUND");
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
    return this.list(userId);
  },

  async remove(userId: string, productId: string) {
    await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return this.list(userId);
  },

  async status(userId: string, productIds: string[]) {
    const rows = await prisma.wishlistItem.findMany({ where: { userId, productId: { in: productIds } } });
    return new Set(rows.map((r) => r.productId));
  },
};