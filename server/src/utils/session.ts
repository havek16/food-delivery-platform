import { randomUUID } from "crypto";
import { delKey, getJson, setJson } from "../config/redis";
import { env } from "../config/env";

/**
 * Server-side session store (Redis, in-memory fallback for dev/tests).
 * Session jti's enable revocation of refresh tokens (logout, password change,
 * admin suspensions) — a requirement that pure stateless JWTs cannot satisfy.
 */
export type Session = {
  sub: string;
  role: string;
  ip?: string;
  createdAt: number;
};

const SESSION_PREFIX = "session:";

export async function createSession(session: Session): Promise<string> {
  const jti = randomUUID();
  await setJson(`${SESSION_PREFIX}${jti}`, session, env.REFRESH_TTL_SECONDS);
  return jti;
}

export async function getSession(jti: string): Promise<Session | null> {
  return getJson<Session>(`${SESSION_PREFIX}${jti}`);
}

export async function revokeSession(jti: string): Promise<void> {
  await delKey(`${SESSION_PREFIX}${jti}`);
}