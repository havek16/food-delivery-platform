import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import {
  hashPassword,
  verifyPassword,
  isValidPassword,
} from "../utils/password";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateBackupCodes,
  generateTotpSecret,
  totpAuthUri,
  verifyTotp,
} from "../utils/totp";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeJti,
  type TokenPair,
} from "../utils/jwt";
import { createSession, getSession, revokeSession } from "../utils/session";
import { HttpError } from "../utils/http";
import { auditService } from "./audit.service";
import { randomToken } from "../utils/crypto";
import { getJson, setJson, delKey } from "../config/redis";
import { notifyService } from "./notify.service";

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "MANAGER" | "SUPERADMIN";
  mfaEnabled: boolean;
  emailVerified: boolean;
  createdAt: Date;
};

export function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "MANAGER" | "SUPERADMIN";
  mfaEnabled: boolean;
  emailVerified: boolean;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

const MFA_LOGIN_TTL = 300; // 5 minutes

function mfaLoginToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { typ: "mfa", email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { algorithm: "HS256", issuer: env.JWT_ISSUER, expiresIn: MFA_LOGIN_TTL, subject: user.id, jwtid: randomToken(16) }
  );
}

function verifyMfaLoginToken(token: string): { sub: string; email: string; role: string } {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
  });
  if (typeof decoded === "string" || decoded.typ !== "mfa" || typeof decoded.sub !== "string") {
    throw HttpError.unauthorized("Invalid MFA challenge", "INVALID_MFA_TOKEN");
  }
  return { sub: decoded.sub, email: decoded.email as string, role: decoded.role as string };
}

async function issueTokens(
  user: { id: string; email: string; role: string },
  ip?: string
): Promise<TokenPair> {
  const sessionId = await createSession({ sub: user.id, role: user.role, ip, createdAt: Date.now() });
  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email, role: user.role, sessionId }),
    refreshToken: signRefreshToken({ sub: user.id, role: user.role }, sessionId),
    jti: sessionId,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
  };
}

async function findLoginUser(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
}

export type RegisterOutcome = {
  mfaRequired: false;
  user: PublicUser;
  tokens: TokenPair;
};

export type LoginOutcome =
  | { mfaRequired: true; loginToken: string; user: PublicUser | null }
  | { mfaRequired: false; user: PublicUser; tokens: TokenPair };

export type MfaVerifyOutcome = { user: PublicUser; tokens: TokenPair };

export const authService = {
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    ip?: string;
    userAgent?: string;
  }): Promise<RegisterOutcome> {
    const email = input.email.toLowerCase().trim();
    if (!isValidPassword(input.password)) {
      throw HttpError.unprocessable(
        "Password must be at least 12 chars with upper/lowercase, a number and a symbol",
        "WEAK_PASSWORD"
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw HttpError.conflict("An account with this email already exists", "EMAIL_TAKEN");

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        emailVerified: true, // demo: treat as verified (real flow would send a token)
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        cartToken: randomToken(16),
      },
    });

    await auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.register",
      category: "auth",
      entityType: "user",
      entityId: user.id,
      result: "success",
      ip: input.ip,
      userAgent: input.userAgent,
    });

    const tokens = await issueTokens(user, input.ip);
    return { user: toPublicUser(user), tokens, mfaRequired: false };
  },

  async login(input: { email: string; password: string; ip?: string; userAgent?: string }): Promise<LoginOutcome> {
    const email = input.email.toLowerCase().trim();
    const user = await findLoginUser(email);

    if (!user) {
      await auditService.log({
        action: "auth.login",
        category: "auth",
        entityType: "user",
        entityId: email,
        result: "failure",
        ip: input.ip,
        userAgent: input.userAgent,
        sensitive: { reason: "unknown_email" },
      });
      throw HttpError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const validPassword = await verifyPassword(input.password, user.passwordHash);
    if (!validPassword) {
      await auditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: "auth.login",
        category: "auth",
        entityType: "user",
        entityId: user.id,
        result: "failure",
        ip: input.ip,
        userAgent: input.userAgent,
        sensitive: { reason: "wrong_password" },
      });
      throw HttpError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    if (user.status === "SUSPENDED") {
      await auditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: "auth.login_blocked",
        category: "auth",
        entityType: "user",
        entityId: user.id,
        result: "failure",
        ip: input.ip,
        userAgent: input.userAgent,
        sensitive: { reason: "account_suspended" },
      });
      throw HttpError.forbidden("Account suspended. Contact support.", "ACCOUNT_SUSPENDED");
    }

    if (user.mfaEnabled && user.totpSecretEncrypted) {
      return { mfaRequired: true, loginToken: mfaLoginToken({ id: user.id, email: user.email, role: user.role }), user: toPublicUser(user) };
    }

    await auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.login",
      category: "auth",
      entityType: "user",
      entityId: user.id,
      result: "success",
      ip: input.ip,
      userAgent: input.userAgent,
    });

    const tokens = await issueTokens(user, input.ip);
    return { mfaRequired: false, user: toPublicUser(user), tokens };
  },

  async verifyMfa(input: { loginToken: string; code: string; ip?: string; userAgent?: string }): Promise<MfaVerifyOutcome> {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = verifyMfaLoginToken(input.loginToken);
    } catch {
      throw HttpError.unauthorized("MFA challenge expired or invalid", "INVALID_MFA_TOKEN");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.mfaEnabled || !user.totpSecretEncrypted) {
      throw HttpError.unauthorized("MFA not enabled for this account", "MFA_NOT_ENABLED");
    }
    const secret = decryptTotpSecret(user.totpSecretEncrypted);
    if (!verifyTotp(input.code.trim(), secret)) {
      await auditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: "auth.mfa_verify",
        category: "auth",
        entityType: "user",
        entityId: user.id,
        result: "failure",
        ip: input.ip,
        userAgent: input.userAgent,
      });
      throw HttpError.unauthorized("Invalid authenticator code", "INVALID_MFA_CODE");
    }

    await auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.mfa_verify",
      category: "auth",
      entityType: "user",
      entityId: user.id,
      result: "success",
      ip: input.ip,
      userAgent: input.userAgent,
    });

    const tokens = await issueTokens(user, input.ip);
    return { user: toPublicUser(user), tokens };
  },

  async refreshToken(input: { refreshToken: string; ip?: string }) {
    if (!input.refreshToken) throw HttpError.unauthorized("Missing refresh token", "NO_REFRESH_TOKEN");
    let payload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw HttpError.unauthorized("Invalid or expired session", "INVALID_REFRESH_TOKEN");
    }

    // Server-side session check — enables immediate revocation.
    const session = await getSession(payload.jti);
    if (!session || session.sub !== payload.sub) {
      throw HttpError.unauthorized("Session revoked", "SESSION_REVOKED");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === "SUSPENDED") {
      await revokeSession(payload.jti);
      throw HttpError.unauthorized("Account no longer active", "ACCOUNT_UNAVAILABLE");
    }

    // Rotate: revoke the old session, mint a new refresh pair.
    await revokeSession(payload.jti);
    const tokens = await issueTokens(user, input.ip);
    return { user: toPublicUser(user), tokens };
  },

  async logout(input: { refreshToken?: string }) {
    const jti = input.refreshToken ? decodeJti(input.refreshToken) : null;
    if (jti) await revokeSession(jti);
  },

  async resetPassword(input: { token: string; newPassword: string }) {
    const userId = await getJson<string>(`pwdreset:${input.token}`);
    if (!userId) throw HttpError.badRequest("Reset token invalid or expired", "INVALID_RESET_TOKEN");
    if (!isValidPassword(input.newPassword)) {
      throw HttpError.unprocessable("New password does not meet strength requirements", "WEAK_PASSWORD");
    }
    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await delKey(`pwdreset:${input.token}`);
    await auditService.log({
      actorId: userId,
      action: "auth.password_reset",
      category: "auth",
      entityType: "user",
      entityId: userId,
      result: "success",
    });
    return { ok: true };
  },

  async requestPasswordReset(input: { email: string }) {
    // Respond identically whether the account exists (prevents enumeration).
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase().trim() } });
    if (user) {
      const token = randomToken(24);
      await setJson(`pwdreset:${token}`, user.id, 30 * 60);
      await notifyService.sendPasswordResetEmail({ email: user.email, token });
      await auditService.log({
        actorId: user.id,
        action: "auth.forgot_password_requested",
        category: "auth",
        entityType: "user",
        entityId: user.id,
        result: "success",
        ip: undefined,
      });
    }
    return { ok: true };
  },

  async changePassword(input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    ip?: string;
    userAgent?: string;
  }) {
    if (!isValidPassword(input.newPassword)) {
      throw HttpError.unprocessable("New password does not meet strength requirements", "WEAK_PASSWORD");
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) throw HttpError.unauthorized("Current password is incorrect", "WRONG_PASSWORD");

    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    await auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.password_change",
      category: "auth",
      entityType: "user",
      entityId: user.id,
      result: "success",
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return { ok: true };
  },

  async setupMfa(input: { userId: string; password: string; ip?: string }) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw HttpError.unauthorized("Password required to enable MFA", "WRONG_PASSWORD");
    if (user.mfaEnabled) throw HttpError.conflict("MFA already enabled", "MFA_ENABLED");

    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // encrypted at rest
        totpSecretEncrypted: encryptTotpSecret(secret),
        totpBackupCodesEncrypted: encryptTotpSecret(backupCodes.join(",")),
      },
    });

    await auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.mfa_setup",
      category: "auth",
      entityType: "user",
      entityId: user.id,
      ip: input.ip,
      sensitive: { backupCodes },
    });

    return {
      otpauthUrl: totpAuthUri(secret, user.email),
      backupCodes: backupCodes.map((c) => `•••• ${c.slice(5)}`), // masked on screen
      fullBackupCodes: backupCodes, // shown exactly once
    };
  },

  async confirmMfa(input: { userId: string; code: string }) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
    if (!user.totpSecretEncrypted) throw HttpError.badRequest("Start MFA setup first", "MFA_NOT_SETUP");
    const secret = decryptTotpSecret(user.totpSecretEncrypted);
    if (!verifyTotp(input.code.trim(), secret)) {
      throw HttpError.unprocessable("Invalid code — MFA not enabled", "INVALID_MFA_CODE");
    }
    await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
    return { mfaEnabled: true };
  },

  async disableMfa(input: { userId: string; password: string; code: string }) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw HttpError.unauthorized("Password required", "WRONG_PASSWORD");
    if (user.totpSecretEncrypted) {
      const secret = decryptTotpSecret(user.totpSecretEncrypted);
      if (!verifyTotp(input.code.trim(), secret)) {
        throw HttpError.unprocessable("Invalid authenticator code", "INVALID_MFA_CODE");
      }
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, totpSecretEncrypted: null, totpBackupCodesEncrypted: null },
    });
    return { mfaEnabled: false };
  },
};