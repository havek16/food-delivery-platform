import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  jti: string;
  expiresIn: number;
};

const baseSignOptions = (): jwt.SignOptions => ({
  algorithm: "HS256",
  issuer: env.JWT_ISSUER,
  expiresIn: env.JWT_ACCESS_TTL_SECONDS,
});

/**
 * Access token — short lived (15m). `typ: 'access'`, carries RBAC role.
 * Stored in an HTTP-only cookie, NEVER in localStorage.
 */
export function signAccessToken(payload: {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
}): string {
  return jwt.sign(
    { typ: "access", role: payload.role, email: payload.email, sid: payload.sessionId },
    env.JWT_ACCESS_SECRET,
    { ...baseSignOptions(), subject: payload.sub, jwtid: payload.sessionId }
  );
}

/**
 * Refresh token — long lived (default 30d). The `jti` IS the session id, tracked
 * in Redis so sessions can be revoked (logout, password change, bans).
 */
export function signRefreshToken(payload: { sub: string; role: string }, jti: string): string {
  return jwt.sign(
    { typ: "refresh", role: payload.role },
    env.JWT_REFRESH_SECRET,
    {
      algorithm: "HS256",
      issuer: env.JWT_ISSUER,
      expiresIn: env.REFRESH_TTL_SECONDS,
      subject: payload.sub,
      jwtid: jti,
    }
  );
}

export type AccessPayload = {
  typ: "access";
  sub: string;
  email: string;
  role: string;
  sid: string;
  exp: number;
};

export type RefreshPayload = {
  typ: "refresh";
  sub: string;
  role: string;
  jti: string;
  exp: number;
};

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
  });
  if (typeof decoded === "string" || decoded.typ !== "access") {
    throw new jwt.JsonWebTokenError("Invalid token type");
  }
  return decoded as unknown as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
  });
  if (typeof decoded === "string" || decoded.typ !== "refresh") {
    throw new jwt.JsonWebTokenError("Invalid token type");
  }
  return decoded as unknown as RefreshPayload;
}

export function decodeJti(token: string): string | null {
  try {
    const decoded = jwt.decode(token);
    if (typeof decoded === "object" && decoded && "jti" in decoded) return decoded.jti as string;
    return null;
  } catch {
    return null;
  }
}