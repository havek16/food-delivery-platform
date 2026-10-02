/**
 * Redis client + tiny in-memory fallback.
 *
 * Redis backs: session tracking (refresh tokens), IP/user rate limiting and
 * temporary checkout sessions. When REDIS_URL is absent (tests, quick starts)
 * the server degrades to a per-process in-memory store — clearly labelled as
 * non-production use.
 */
import Redis from "ioredis";
import { env, isProd } from "./env";
import { logger } from "./logger";

let redis: Redis | null = null;
let redisConnected = false;

function getClient(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (redis) return redis;
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    enableOfflineQueue: false,
  });
  redis.on("connect", () => {
    redisConnected = true;
    logger.info("redis:connected");
  });
  redis.on("error", (err) => {
    redisConnected = false;
    if (!redis?.status || redis.status === "end") return;
    logger.warn("redis:error", { message: err.message });
  });
  return redis;
}

export function usingRedis(): boolean {
  return redisConnected;
}

type Counter = { count: number; ttlSeconds: number; redis: boolean };

const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * Increments a fixed-window counter for `key` with `windowSeconds` reset.
 * Returns the current count and remaining TTL so callers can enforce limits.
 */
export async function incrCounter(key: string, windowSeconds: number): Promise<Counter> {
  const client = getClient();
  if (client) {
    try {
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSeconds);
      const ttl = await client.ttl(key);
      return { count, ttlSeconds: Math.max(1, ttl), redis: true };
    } catch (err) {
      logger.warn("redis:incr-fallback", { error: (err as Error).message });
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now >= entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { count: 1, ttlSeconds: windowSeconds, redis: false };
  }
  entry.count += 1;
  const ttlSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return { count: entry.count, ttlSeconds, redis: false };
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getClient();
  if (client) await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  else {
    const now = Date.now();
    memorySerialized.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
  }
}

export async function getJson<T>(key: string): Promise<T | null> {
  const client = getClient();
  if (client) {
    const raw = await client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  const entry = memorySerialized.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memorySerialized.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function delKey(key: string): Promise<void> {
  const client = getClient();
  if (client) await client.del(key);
  else memorySerialized.delete(key);
}

const memorySerialized = new Map<string, { value: unknown; expiresAt: number }>();

// Warn once when running without Redis in production.
if (isProd && !env.REDIS_URL) {
  logger.warn("redis:unavailable-in-production-falling-back-to-in-memory");
}

export async function pingRedis(): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    return (await client.ping()) === "PONG";
  } catch {
    return false;
  }
}

/** Test-only: drops all in-memory buckets so spec isolation is total. */
export function resetRedisForTests(): void {
  memory.clear();
  memorySerialized.clear();
  if (redis) {
    redis.disconnect();
    redis = null;
    redisConnected = false;
  }
}