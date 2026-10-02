import crypto from "crypto";
import { env } from "../config/env";

/**
 * Encryption at rest — AES-256-GCM.
 * Sensitive fields (e.g. TOTP secrets, admin mutation payloads) are encrypted
 * before persisting to PostgreSQL. Format: `v1:iv:authTag:cipher` base64.
 */
function key(): Buffer {
  // Accept a base64 32-byte key OR a raw 32-char string for convenience.
  const k = env.ENCRYPTION_KEY;
  const buf = /^[A-Za-z0-9+/=]+$/.test(k) && k.length >= 40 ? Buffer.from(k, "base64") : Buffer.from(k, "utf8");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to a 32-byte AES-256 key");
  }
  return buf;
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptJson(value: unknown): string {
  return encrypt(JSON.stringify(value));
}

export function decryptJson<T>(payload: string): T | null {
  try {
    return JSON.parse(decrypt(payload)) as T;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}