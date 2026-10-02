import { z } from "zod";
import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";

// Load `.env` from the server package dir, or the repo root, or explicit path.
const candidates = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
  __dirname ? path.resolve(__dirname, "..", "..", "..", "..", ".env") : undefined,
].filter(Boolean) as string[];

for (const file of candidates) {
  if (existsSync(file)) {
    dotenv.config({ path: file });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://127.0.0.1:3000"),
  TRUST_PROXY: z
    .string()
    .transform((v) => v === "true" || v === "1")
    .default("false"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ISSUER: z.string().default("AuraEssence"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  COOKIE_DOMAIN: z.string().default("").transform((v) => (v ? v : undefined)),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true" || v === "1")
    .default("false"),
  REFRESH_COOKIE_NAME: z.string().default("aura_refresh"),

  CSRF_COOKIE_NAME: z.string().default("aura_csrf"),
  CSRF_SECRET: z.string().min(32, "CSRF_SECRET must be at least 32 chars"),

  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be a 32-byte base64 string"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().default("usd"),

  TAX_RATE_PERCENT: z.coerce.number().min(0).max(100).default(8),
  FREE_SHIPPING_THRESHOLD_CENTS: z.coerce.number().int().nonnegative().default(15000),
  SHIPPING_FLAT_CENTS: z.coerce.number().int().nonnegative().default(900),

  ADMIN_INITIAL_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env: Env = parseEnv(process.env);

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export function corsOrigins(): string[] {
  return env.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}