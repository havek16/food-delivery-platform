import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("A valid email is required")
  .max(255);

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128)
  .regex(/[A-Z]/, "Needs an uppercase letter")
  .regex(/[a-z]/, "Needs a lowercase letter")
  .regex(/[0-9]/, "Needs a number")
  .regex(/[^A-Za-z0-9]/, "Needs a symbol");

export const nameSchema = z.string().trim().min(1).max(80);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const mfaVerifySchema = z.object({
  loginToken: z.string().min(1),
  code: z.string().trim().regex(/^\d{6}$/, "6-digit code required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const profileSchema = z
  .object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
  })
  .strict();

export const mfaConfirmSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/) });

export const mfaSetupSchema = z.object({ password: z.string().min(1) });

export const mfaDisableSchema = z.object({ password: z.string().min(1), code: z.string().trim().regex(/^\d{6}$/) });

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();

export const resetPasswordSchema = z
  .object({ token: z.string().trim().min(1).max(200), newPassword: passwordSchema })
  .strict();

export const addressSchema = z
  .object({
    label: z.string().trim().min(1).max(40).optional(),
    line1: z.string().trim().min(1).max(200),
    line2: z.string().trim().max(200).optional().nullable(),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    postalCode: z.string().trim().min(1).max(20),
    country: z.string().trim().length(2).default("US"),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  family: z.enum(["WOODY", "FLORAL", "FRESH", "ORIENTAL"]).optional(),
  concentration: z.enum(["PARFUM", "EDP", "EDT"]).optional(),
  gender: z.enum(["WOMEN", "MEN", "UNISEX"]).optional(),
  type: z.enum(["SINGLE", "GIFT_SET"]).optional(),
  note: z.string().trim().max(60).optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "featured"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const quizSchema = z
  .object({
    families: z.array(z.enum(["WOODY", "FLORAL", "FRESH", "ORIENTAL"])).max(4).optional(),
    concentrations: z.array(z.enum(["PARFUM", "EDP", "EDT"])).max(3).optional(),
    gender: z.enum(["WOMEN", "MEN", "UNISEX"]).optional(),
    notes: z.array(z.string().trim().min(1).max(60)).max(8).optional(),
    priceMax: z.coerce.number().int().nonnegative().optional(),
    occasion: z.enum(["day", "evening", "office", "special"]).optional(),
  })
  .strict();

export const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(160) });

export const exploreQuerySchema = z.object({ note: z.string().trim().min(1).max(60) });

export const idParamSchema = z.object({ id: z.string().trim().min(1).max(64) });

export const cartItemSchema = z.object({ productId: z.string().min(1).max(64), quantity: z.coerce.number().int().min(1).max(24) });

export const cartUpdateSchema = z.object({ quantity: z.coerce.number().int().min(0).max(24) });

export const cartSyncSchema = z.object({
  items: z.array(cartItemSchema).max(100),
});

export const checkoutSchema = z
  .object({
    guestEmail: emailSchema.optional(),
    items: z.array(cartItemSchema).min(1).max(100),
    shippingAddress: z.object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().min(1).max(80),
      line1: z.string().trim().min(1).max(200),
      line2: z.string().trim().max(200).optional().nullable(),
      city: z.string().trim().min(1).max(80),
      state: z.string().trim().min(1).max(80),
      postalCode: z.string().trim().min(1).max(20),
      country: z.string().trim().length(2).default("US"),
    }),
    billingAddress: z
      .object({
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().min(1).max(80),
        line1: z.string().trim().min(1).max(200),
        line2: z.string().trim().max(200).optional().nullable(),
        city: z.string().trim().min(1).max(80),
        state: z.string().trim().min(1).max(80),
        postalCode: z.string().trim().min(1).max(20),
        country: z.string().trim().length(2).default("US"),
      })
      .optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export const productCreateSchema = z
  .object({
    slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and dashes"),
    name: z.string().trim().min(1).max(120),
    tagline: z.string().trim().min(1).max(160),
    description: z.string().trim().min(20).max(4000),
    family: z.enum(["WOODY", "FLORAL", "FRESH", "ORIENTAL"]),
    concentration: z.enum(["PARFUM", "EDP", "EDT"]),
    gender: z.enum(["WOMEN", "MEN", "UNISEX"]).default("UNISEX"),
    type: z.enum(["SINGLE", "GIFT_SET"]).default("SINGLE"),
    priceCents: z.coerce.number().int().positive().max(100_000_00),
    stock: z.coerce.number().int().nonnegative().max(10_000),
    sizeMl: z.coerce.number().int().positive().max(500).optional(),
    isFeatured: z.boolean().optional(),
    notes: z
      .array(
        z.object({
          note: z.string().trim().min(1).max(60),
          position: z.enum(["TOP", "HEART", "BASE"]),
          intensity: z.coerce.number().int().min(1).max(5),
        })
      )
      .max(20)
      .optional(),
  })
  .strict();

export const productUpdateSchema = productCreateSchema.partial().strict();

export const notesUpdateSchema = z
  .object({
    notes: z
      .array(
        z.object({
          note: z.string().trim().min(1).max(60),
          position: z.enum(["TOP", "HEART", "BASE"]),
          intensity: z.coerce.number().int().min(1).max(5),
        })
      )
      .max(20),
  })
  .strict();

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export const refundSchema = z.object({ reason: z.string().trim().min(1).max(200).default("requested_by_customer") }).strict();

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  role: z.enum(["USER", "MANAGER", "SUPERADMIN"]).optional(),
  search: z.string().trim().max(120).optional(),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
});

export const auditQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  action: z.string().trim().max(120).optional(),
});

export const roleSchema = z.object({ role: z.enum(["USER", "MANAGER", "SUPERADMIN"]) }).strict();

export const userStatusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).strict();

export const staffCreateSchema = z
  .object({
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    role: z.enum(["USER", "MANAGER", "SUPERADMIN"]),
  })
  .strict();