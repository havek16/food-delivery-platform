import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. The connection lifecycle is managed by Prisma;
 * in tests the generated client is stubbed (see tests/setup.ts).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;