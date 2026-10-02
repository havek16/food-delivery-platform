import { Router } from "express";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { asyncHandler, ok } from "../utils/http";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { setAccessCookie, setRefreshCookie, clearAuthCookies } from "../lib/cookies";
import {
  registerSchema,
  loginSchema,
  mfaVerifySchema,
  changePasswordSchema,
  profileSchema,
  mfaSetupSchema,
  mfaConfirmSchema,
  mfaDisableSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schemas";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { user, tokens, mfaRequired } = await authService.register({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    setAccessCookie(res, tokens.accessToken);
    setRefreshCookie(res, tokens.refreshToken);
    ok(res, { user, mfaRequired }, { session: tokens.jti }, 201);
  })
);

authRoutes.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    if (result.mfaRequired) {
      ok(res, { mfaRequired: true, loginToken: result.loginToken }, { mfa: true });
      return;
    }
    setAccessCookie(res, result.tokens.accessToken);
    setRefreshCookie(res, result.tokens.refreshToken);
    ok(res, { user: result.user, mfaRequired: false }, { session: result.tokens.jti });
  })
);

authRoutes.post(
  "/mfa/verify",
  authLimiter,
  validateBody(mfaVerifySchema),
  asyncHandler(async (req, res) => {
    const result = await authService.verifyMfa({
      loginToken: req.body.loginToken,
      code: req.body.code,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    setAccessCookie(res, result.tokens.accessToken);
    setRefreshCookie(res, result.tokens.refreshToken);
    ok(res, { user: result.user, mfaRequired: true }, { session: result.tokens.jti });
  })
);

authRoutes.post(
  "/refresh",
  authLimiter,
  asyncHandler(async (req, res) => {
    const old = req.cookies?.[process.env.REFRESH_COOKIE_NAME ?? "aura_refresh"];
    const { user, tokens } = await authService.refreshToken({ refreshToken: old, ip: req.ip });
    setAccessCookie(res, tokens.accessToken);
    setRefreshCookie(res, tokens.refreshToken);
    ok(res, { user }, { session: tokens.jti });
  })
);

// Anti-enumeration, rate-limited password reset. Always returns OK.
authRoutes.post(
  "/forgot-password",
  authLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.requestPasswordReset({ email: req.body.email });
    ok(res, result);
  })
);

authRoutes.post(
  "/reset-password",
  authLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword({ token: req.body.token, newPassword: req.body.newPassword });
    ok(res, result);
  })
);

authRoutes.get("/me", requireAuth(), asyncHandler(async (req, res) => {
  const user = req.user!;
  ok(res, {
    user: { id: user.id, email: user.email, role: user.role },
  });
}));

authRoutes.patch(
  "/me",
  requireAuth(),
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    ok(res, { user });
  })
);

// Two-factor
authRoutes.post(
  "/me/mfa/setup",
  requireAuth(),
  validateBody(mfaSetupSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.setupMfa({
      userId: req.user!.id,
      password: req.body.password,
      ip: req.ip,
    });
    ok(res, data);
  })
);

authRoutes.post(
  "/me/mfa/confirm",
  requireAuth(),
  validateBody(mfaConfirmSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.confirmMfa({ userId: req.user!.id, code: req.body.code });
    ok(res, result);
  })
);

authRoutes.post(
  "/me/mfa/disable",
  requireAuth(),
  validateBody(mfaDisableSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.disableMfa({
      userId: req.user!.id,
      password: req.body.password,
      code: req.body.code,
    });
    ok(res, result);
  })
);

authRoutes.post(
  "/logout",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const refresh = req.cookies?.[process.env.REFRESH_COOKIE_NAME ?? "aura_refresh"] as string | undefined;
    await authService.logout({ refreshToken: refresh });
    clearAuthCookies(res);
    ok(res, { loggedOut: true });
  })
);

authRoutes.post(
  "/me/password",
  requireAuth(),
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword({
      userId: req.user!.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    // Invalidate all other sessions by refreshing the current one implicitly —
    // the client re-authenticates after a password change.
    ok(res, { passwordChanged: true });
  })
);