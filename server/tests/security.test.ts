import request from "supertest";
import { authService } from "../src/services/auth.service";
import { app, makeRealTokens, type TestAgent } from "./helpers";

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

const mock = (authService as unknown) as { login: jest.Mock };

const VALID_LOGIN = { email: "buyer@aura-essence.local", password: "Str0ng!Passphrase2026" };

/**
 * Security surface:
 *  - CSRF double-submit enforcement on state-changing requests
 *  - rate limiting on the authentication endpoints
 *  - HTTP security headers present on every response
 *  - unknown routes are 404'd as JSON (no HTML leaks)
 */
describe("security middleware", () => {
  let agent: TestAgent;
  let csrf: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    agent = request.agent(app);
    const res = await agent.get("/api/csrf").expect(200);
    csrf = res.body.data.csrfToken as string;
    mock.login.mockResolvedValue({
      mfaRequired: false,
      user: { id: "u1", email: VALID_LOGIN.email, firstName: "A", lastName: "B", role: "USER", mfaEnabled: false, emailVerified: true, createdAt: new Date() },
      tokens: makeRealTokens({ id: "u1", email: VALID_LOGIN.email, role: "USER" }),
    });
  });

  it("rejects state-changing requests without a CSRF token (403)", async () => {
    const res = await request(app).post("/api/auth/login").send(VALID_LOGIN).expect(403);
    expect(res.body.error.code).toBe("CSRF_FAILED");
  });

  it("rejects mismatched CSRF tokens even when a valid cookie exists", async () => {
    const buf = await agent.get("/api/auth/me").expect(401); // seeds cookies
    void buf;
    const res = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", "forged.token")
      .send(VALID_LOGIN)
      .expect(403);
    expect(res.body.error.code).toBe("CSRF_FAILED");
  });

  it("accepts a valid double-submit token pair", async () => {
    const res = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send(VALID_LOGIN)
      .expect(200);
    expect(res.body.data.user.email).toBe(VALID_LOGIN.email);
  });

  it("sets strict security headers on every response", async () => {
    const res = await agent.get("/api/health").expect(200);
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["x-download-options"]).toBeUndefined();
  });

  it("rate-limits the login endpoint (12/min per IP)", async () => {
    let got429 = false;
    for (let i = 0; i < 13; i += 1) {
      const res = await agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrf)
        .send(VALID_LOGIN);
      if (res.status === 429) {
        got429 = true;
        expect(res.headers["retry-after"]).toBeDefined();
        break;
      }
      expect(res.status).toBe(200);
    }
    expect(got429).toBe(true);
  });

  it("returns JSON 404 for unknown routes (no stack leakage)", async () => {
    const res = await request(app).get("/api/definitely-not-a-route").expect(404);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(JSON.stringify(res.body)).not.toContain("at ");
  });

  it("masks internal errors in production mode", async () => {
    mock.login.mockRejectedValueOnce(new Error("postgres connection refused: 10.0.0.5:5432"));
    const res = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send(VALID_LOGIN)
      .expect(500);
    expect(res.body.error.code).toBe("INTERNAL");
    expect(JSON.stringify(res.body)).not.toContain("postgres");
  });
});