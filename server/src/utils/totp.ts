import { authenticator } from "otplib";
import { env } from "../config/env";
import { decrypt, encrypt } from "./crypto";

/**
 * TOTP (RFC 6238) helpers for admin MFA.
 * Secrets are stored encrypted at rest (AES-256-GCM) via utils/crypto.ts.
 */
authenticator.options = { window: 1 }; // tolerate ±30s clock drift

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpAuthUri(secret: string, account: string): string {
  return authenticator.keyuri(account, "Aura & Essence", secret);
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export function encryptTotpSecret(secret: string): string {
  return encrypt(secret);
}

export function decryptTotpSecret(encrypted: string): string {
  return decrypt(encrypted);
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    // 8-char codes, unambiguous alphabet (no 0/O/1/I)
    authenticator.generateSecret()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/[0O1I]/g, "7")
      .slice(0, 8)
      .replace(/(.{4})(?=.)/g, "$1-")
  );
}

export function totpIssuer(): string {
  return env.JWT_ISSUER;
}