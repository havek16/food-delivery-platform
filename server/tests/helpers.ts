import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app";
import { signAccessToken, signRefreshToken } from "../src/utils/jwt";

export const app: Express = createApp();

export type TestUser = { id: string; email: string; role: "USER" | "MANAGER" | "SUPERADMIN" };

/** type of supertest's cookie jar agent from `request.agent(app)`. */
export type TestAgent = ReturnType<typeof request.agent>;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

/** Mints REAL signed tokens (using test env secrets) so auth middleware runs end-to-end. */
export function makeRealTokens(user: TestUser = { id: "u_test_1", email: "test@aura-essence.local", role: "USER" }): SessionTokens {
  const sessionId = `ses_${Math.random().toString(36).slice(2, 12)}`;
  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email, role: user.role, sessionId }),
    refreshToken: signRefreshToken({ sub: user.id, role: user.role }, sessionId),
    sessionId,
  };
}

/** Seeds the signed CSRF cookie + returns its token using the official /csrf route. */
export async function csrfTokenFor(agent: TestAgent): Promise<string> {
  const res = await agent.get("/api/csrf").expect(200);
  return res.body.data.csrfToken as string;
}

/** Convenience: attaches auth cookies + CSRF headers to a request. */
export function authedGet(agent: TestAgent, tokens: SessionTokens, url: string, csrfToken: string) {
  return agent
    .get(url)
    .set("Cookie", `aura_access=${tokens.accessToken}; aura_refresh=${tokens.refreshToken}`)
    .set("X-CSRF-Token", csrfToken);
}

export function authedPost(
  agent: TestAgent,
  tokens: SessionTokens,
  url: string,
  csrfToken: string,
  body: Record<string, unknown>
) {
  return agent
    .post(url)
    .set("Cookie", `aura_access=${tokens.accessToken}; aura_refresh=${tokens.refreshToken}`)
    .set("X-CSRF-Token", csrfToken)
    .send(body);
}