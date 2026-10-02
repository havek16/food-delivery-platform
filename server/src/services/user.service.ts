import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";
import { toPublicUser } from "./auth.service";
import { orderService } from "./order.service";

export const userService = {
  async dashboard(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const [orderCount, wishlistCount, recentOrders] = await Promise.all([
      orderService.countForUser(userId),
      prisma.wishlistItem.count({ where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
    return {
      user: toPublicUser(user),
      stats: { orderCount, wishlistCount },
      recentOrders,
    };
  },

  async updateProfile(
    userId: string,
    input: { firstName?: string; lastName?: string; email?: string }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName ? { firstName: input.firstName.trim() } : {}),
        ...(input.lastName ? { lastName: input.lastName.trim() } : {}),
      },
    });
    return toPublicUser(user);
  },

  async listAddresses(userId: string) {
    return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
  },

  async addAddress(
    userId: string,
    input: {
      label?: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      isDefault?: boolean;
    }
  ) {
    const count = await prisma.address.count({ where: { userId } });
    if (count >= 8) throw HttpError.badRequest("Address limit reached", "ADDRESS_LIMIT");
    const isDefault = input.isDefault ?? count === 0;
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.create({
      data: {
        userId,
        label: input.label ?? "Home",
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country ?? "US",
        isDefault,
      },
    });
  },

  async updateAddress(userId: string, addressId: string, input: Record<string, unknown>) {
    const owned = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!owned) throw HttpError.notFound("Address not found", "ADDRESS_NOT_FOUND");
    if (input.isDefault === true) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.update({ where: { id: addressId }, data: input });
  },

  async deleteAddress(userId: string, addressId: string) {
    const owned = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!owned) throw HttpError.notFound("Address not found", "ADDRESS_NOT_FOUND");
    await prisma.address.delete({ where: { id: addressId } });
    return { ok: true };
  },
};