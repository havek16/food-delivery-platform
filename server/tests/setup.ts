/**
 * Jest bootstrap — sets a controlled test environment and stubs external
 * infrastructure (@prisma/client) so route tests never touch a real database.
 */

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret-that-is-long-enough-1234567890";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-that-is-long-enough-abcdefghij";
process.env.CSRF_SECRET = process.env.CSRF_SECRET ?? "test-csrf-secret-that-is-long-enough-0987654321";
process.env.ENCRYPTION_KEY = Buffer.from("test-encryption-key-1234567890abcdef").toString("base64");
process.env.REDIS_URL = process.env.REDIS_URL ?? "";
process.env.COOKIE_SECURE = "false";

// Stub the generated Prisma client. Individual tests mock the app's service
// modules; this Proxy guarantees the client module can be required safely.
jest.mock("@prisma/client", () => {
  const handler: ProxyHandler<Record<PropertyKey, any>> = {
    get: (_target, prop) => {
      if (prop === "PrismaClient") return jest.fn();
      return jest.fn();
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => new Proxy({}, handler)),
  };
});

// Rate-limit buckets and session stores are process-global singletons that
// would otherwise leak counters between test suites. Reset them every test.
beforeEach(async () => {
  const { resetRedisForTests } = await import("../src/config/redis");
  resetRedisForTests();
});