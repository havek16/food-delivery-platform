import type { ApiOk } from "./types";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let csrfToken: string | null = null;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${API_BASE}/csrf`, { credentials: "include" });
    const json = (await res.json()) as ApiOk<{ csrfToken: string }>;
    if (res.ok) csrfToken = json.data.csrfToken;
  } catch {
    // Server offline — callers surface a readable error.
  }
  if (!csrfToken) throw new ApiError("Security token unavailable — refresh the page.", 0, "CSRF_UNAVAILABLE");
  return csrfToken;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  const init: RequestInit = { method, headers, credentials: "include" };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = await ensureCsrf();
    init.body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError("Unable to reach the Aura & Essence service.", 0, "NETWORK");
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as ApiOk<T> | null;
  if (!res.ok) {
    const errorBody =
      json && "error" in json
        ? (json as { error: { code: string; message: string; details?: unknown } }).error
        : { code: "UNKNOWN", message: "Request failed.", details: undefined as unknown };
    const message = Array.isArray(errorBody.details)
      ? (errorBody.details[0] as { message?: string } | undefined)?.message
      : errorBody.message;
    throw new ApiError(message ?? "Request failed.", res.status, errorBody.code, errorBody.details);
  }
  return json?.data as T;
}

export const apiRoutes = {
  csrf: "/csrf",
  products: "/products",
  product: (slug: string) => `/products/${slug}`,
  cart: "/cart",
  cartItems: "/cart/items",
  cartItem: (id: string) => `/cart/items/${id}`,
  wishlist: "/me/wishlist",
  wishlistItem: (id: string) => `/me/wishlist/${id}`,
  login: "/auth/login",
  register: "/auth/register",
  logout: "/auth/logout",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  me: "/auth/me",
  mfaVerify: "/auth/mfa/verify",
  mfaSetup: "/auth/me/mfa/setup",
  mfaConfirm: "/auth/me/mfa/confirm",
  mfaDisable: "/auth/me/mfa/disable",
  dashboard: "/me/dashboard",
  orders: "/me/orders",
  order: (id: string) => `/me/orders/${id}`,
  addresses: "/me/addresses",
  address: (id: string) => `/me/addresses/${id}`,
  checkoutConfig: "/checkout/config",
  checkoutSession: "/checkout/session",
  checkoutPreparation: (id: string) => `/checkout/session/${id}`,
  checkoutSync: "/checkout/sync",
  quizQuestions: "/quiz/questions",
  quizRecommendations: "/quiz/recommendations",
} as const;

/** Best-effort: re-primes the CSRF token from the server. */
export function resetCsrf(): void {
  csrfToken = null;
}