import request from "supertest";
import { HttpError } from "../src/utils/http";
import { authService, type PublicUser } from "../src/services/auth.service";
import { userService } from "../src/services/user.service";
import { app, makeRealTokens, csrfTokenFor, authedGet, authedPost, type TestAgent } from "./helpers";

jest.mock("../src/services/auth.service", () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    verifyMfa: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    setupMfa: jest.fn(),
    confirmMfa: jest.fn(),
    disableMfa: jest.fn(),
  },
}));

jest.mock("../src/services/user.service", () => ({
  userService: { updateProfile: jest.fn() },
}));

const mock = (authService as unknown) as {
  register: jest.Mock;
  login: jest.Mock;
  verifyMfa: jest.Mock;
  logout: jest.Mock;
  refreshToken: jest.Mock;
  changePassword: jest.Mock;
  requestPasswordReset: jest.Mock;
  resetPassword: jest.Mock;
  setupMfa: jest.Mock;
  confirmMfa: jest.Mock;
  disableMfa: jest.Mock;
};

const demoUser: PublicUser = {
  id: "u_demo",
  email: "isabella@aura-essence.local",
  firstName: "Isabella",
  lastName: "Vane",
  role: "USER",
  mfaEnabled: false,
  emailVerified: true,
  createdAt: new Date("2025-11-02T10:00:00Z"),
};

const VALID_USER = {
  email: "new@aura-essence.local",
  password: "Str0ng!Passphrase2026",
  firstName: "Aurelia",
  lastName: "Stone",
};

describe("auth routes", () => {
  let agent: TestAgent;
  let csrf: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    agent = request.agent(app);
    csrf = await csrfTokenFor(agent);
  });

  it("rejects weak passwords before reaching the service (validation boundary)", async () => {
    const res = await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrf)
      .send({ ...VALID_USER, password: "short" })
      .expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(mock.register).not.toHaveBeenCalled();
  });

  it("registers a user and issues HttpOnly auth cookies", async () => {
    const tokens = makeRealTokens({ id: "u_demo", email: VALID_USER.email, role: "USER" });
    mock.register.mockResolvedValue({
      user: demoUser,
      tokens,
      mfaRequired: false,
    });

    const res = await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrf)
      .send(VALID_USER)
      .expect(201);

    expect(res.body.data.user.email).toBe(demoUser.email);
    const setCookie = (res.headers["set-cookie"] as unknown as string[]) ?? [];
    const joined = setCookie.join("; ");
    expect(joined).toContain("aura_access");
    expect(joined).toContain("aura_refresh");

    // HttpOnly + SameSite=strict are non-negotiable.
    const access = setCookie.find((c) => c.startsWith("aura_access")) ?? "";
    expect(/httponly/i.test(access)).toBe(true);
    expect(/samesite=strict/i.test(access)).toBe(true);
  });

  it("returns a challenge when the account requires MFA", async () => {
    mock.login.mockResolvedValue({ mfaRequired: true, loginToken: "challenge.token.abc", user: null });

    const res = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send({ email: "admin@aura-essence.local", password: "whatever1!Aa" })
      .expect(200);

    expect(res.body.data.mfaRequired).toBe(true);
    expect(res.body.data.loginToken).toBe("challenge.token.abc");
    expect(res.headers["set-cookie"]).toBeUndefined(); // no session before OTP
  });

  it("verifies MFA and completes login", async () => {
    const tokens = makeRealTokens({ id: "u_admin", email: "admin@aura-essence.local", role: "SUPERADMIN" });
    mock.verifyMfa.mockResolvedValue({ user: demoUser, tokens });

    const res = await agent
      .post("/api/auth/mfa/verify")
      .set("X-CSRF-Token", csrf)
      .send({ loginToken: "challenge.token.abc", code: "123456" })
      .expect(200);
    expect(res.body.data.user.email).toBe(demoUser.email);
  });

  it("guards /me behind authentication", async () => {
    await agent.get("/api/auth/me").expect(401);
  });

  it("serves /me with a valid access cookie (real JWT validation)", async () => {
    const tokens = makeRealTokens(demoUser as never);
    const res = await authedGet(agent, tokens, "/api/auth/me", csrf).expect(200);
    expect(res.body.data.user.id).toBe(demoUser.id);
    expect(res.body.data.user.email).toBe(demoUser.email);
  });

  it("rotates the session on refresh and revokes when the server session is gone", async () => {
    const tokens = makeRealTokens(demoUser as never);
    const rotated = makeRealTokens(demoUser as never);

    mock.refreshToken.mockResolvedValueOnce({ user: demoUser, tokens: rotated });
    const okRes = await agent
      .post("/api/auth/refresh")
      .set("Cookie", `aura_refresh=${tokens.refreshToken}`)
      .set("X-CSRF-Token", csrf)
      .expect(200);
    expect(okRes.body.data.user.email).toBe(demoUser.email);

    mock.refreshToken.mockRejectedValueOnce(
      HttpError.unauthorized("Session revoked", "SESSION_REVOKED")
    );
    const revokedRes = await agent
      .post("/api/auth/refresh")
      .set("Cookie", `aura_refresh=${tokens.refreshToken}`)
      .set("X-CSRF-Token", csrf)
      .expect(401);
    expect(revokedRes.body.error.code).toBe("SESSION_REVOKED");
  });

  it("is immune to email enumeration on password reset", async () => {
    mock.requestPasswordReset.mockResolvedValue({ ok: true });
    const known = await agent
      .post("/api/auth/forgot-password")
      .set("X-CSRF-Token", csrf)
      .send({ email: "isabella@aura-essence.local" })
      .expect(200);
    const unknown = await agent
      .post("/api/auth/forgot-password")
      .set("X-CSRF-Token", csrf)
      .send({ email: "nobody@aura-essence.local" })
      .expect(200);
    expect(known.body.data).toEqual(unknown.body.data);
  });

  it("rejects an invalid reset password with a readable 422", async () => {
    const res = await agent
      .post("/api/auth/reset-password")
      .set("X-CSRF-Token", csrf)
      .send({ token: "abc123", newPassword: "short" })
      .expect(422);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("updates the caller profile via the user service", async () => {
    const tokens = makeRealTokens(demoUser as never);
    (userService.updateProfile as jest.Mock).mockResolvedValue(demoUser);
    const res = await agent
      .patch("/api/auth/me")
      .set("Cookie", `aura_access=${tokens.accessToken}; aura_refresh=${tokens.refreshToken}`)
      .set("X-CSRF-Token", csrf)
      .send({ firstName: "Aura" })
      .expect(200);
    expect(res.body.data.user.firstName).toBe(demoUser.firstName);
  });
});