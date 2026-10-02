import { Router } from "express";
import { requireAuth, requireActiveUser } from "../middleware/auth";
import { requireRoles, MANAGER_ROLES, SUPERADMIN_ONLY } from "../middleware/rbac";
import { adminService } from "../services/admin.service";
import { parsePagination, asyncHandler, ok, paginated } from "../utils/http";
import { validateBody, validateParams } from "../middleware/validate";
import {
  productCreateSchema,
  productUpdateSchema,
  notesUpdateSchema,
  refundSchema,
  orderStatusSchema,
  roleSchema,
  userStatusSchema,
  staffCreateSchema,
  idParamSchema,
} from "./schemas";
import { OrderStatus } from "@prisma/client";

export const adminRoutes = Router();

adminRoutes.use(requireAuth(), requireActiveUser());
adminRoutes.use(requireRoles("MANAGER", "SUPERADMIN"));

// ---------------------------------------------------------------------------
// Products — MANAGER & SUPERADMIN
// ---------------------------------------------------------------------------
adminRoutes.post(
  "/products",
  validateBody(productCreateSchema),
  asyncHandler(async (req, res) => {
    const product = await adminService.createProduct(req.body, req.user!, req.ip);
    ok(res, { product }, {}, 201);
  })
);

adminRoutes.patch(
  "/products/:id",
  validateParams(idParamSchema),
  validateBody(productUpdateSchema),
  asyncHandler(async (req, res) => {
    const product = await adminService.updateProduct(req.params.id, req.body, req.user!, req.ip);
    ok(res, { product });
  })
);

adminRoutes.put(
  "/products/:id/notes",
  validateParams(idParamSchema),
  validateBody(notesUpdateSchema),
  asyncHandler(async (req, res) => {
    const result = await adminService.setProductNotes(req.params.id, req.body.notes, req.user!, req.ip);
    ok(res, result);
  })
);

adminRoutes.delete(
  "/products/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    await adminService.deleteProduct(req.params.id, req.user!, req.ip);
    ok(res, { deactivated: true });
  })
);

// ---------------------------------------------------------------------------
// Orders — MANAGER & SUPERADMIN
// ---------------------------------------------------------------------------
const STATUSES: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

adminRoutes.get("/orders", asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query as unknown as Record<string, unknown>);
  const status = STATUSES.includes(req.query.status as OrderStatus)
    ? (req.query.status as OrderStatus)
    : undefined;
  const result = await adminService.listOrders({
    status,
    skip: pagination.skip,
    take: pagination.take,
  });
  paginated(res, result.items, result.total, pagination.page, pagination.pageSize);
}));

adminRoutes.get("/orders/:id", validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const order = await adminService.getOrder(req.params.id);
  ok(res, { order });
}));

adminRoutes.patch(
  "/orders/:id/status",
  validateParams(idParamSchema),
  validateBody(orderStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await adminService.updateOrderStatus(req.params.id, req.body.status, req.user!, req.ip);
    ok(res, { order });
  })
);

adminRoutes.post(
  "/orders/:id/refund",
  validateParams(idParamSchema),
  validateBody(refundSchema),
  asyncHandler(async (req, res) => {
    const order = await adminService.refundOrder(req.params.id, req.body.reason, req.user!, req.ip);
    ok(res, { order });
  })
);

// ---------------------------------------------------------------------------
// Users — SUPERADMIN only
// ---------------------------------------------------------------------------
adminRoutes.get("/users", requireRoles(...SUPERADMIN_ONLY), asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query as unknown as Record<string, unknown>);
  const result = await adminService.listUsers({
    page: pagination.page,
    pageSize: pagination.pageSize,
    role: (req.query.role as never) ?? undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  paginated(res, result.items, result.total, pagination.page, pagination.pageSize);
}));

adminRoutes.post(
  "/users/staff",
  requireRoles(...SUPERADMIN_ONLY),
  validateBody(staffCreateSchema),
  asyncHandler(async (req, res) => {
    const result = await adminService.createStaffUser(req.body, req.user!, req.ip);
    ok(res, result, {}, 201);
  })
);

adminRoutes.patch(
  "/users/:id/role",
  requireRoles(...SUPERADMIN_ONLY),
  validateParams(idParamSchema),
  validateBody(roleSchema),
  asyncHandler(async (req, res) => {
    const result = await adminService.setUserRole(req.params.id, req.body.role, req.user!, req.ip);
    ok(res, result);
  })
);

adminRoutes.patch(
  "/users/:id/status",
  requireRoles(...SUPERADMIN_ONLY),
  validateParams(idParamSchema),
  validateBody(userStatusSchema),
  asyncHandler(async (req, res) => {
    const result = await adminService.setUserStatus(req.params.id, req.body.status, req.user!, req.ip);
    ok(res, result);
  })
);

// ---------------------------------------------------------------------------
// Audit trail — SUPERADMIN
// ---------------------------------------------------------------------------
adminRoutes.get("/audit", requireRoles(...SUPERADMIN_ONLY), asyncHandler(async (req, res) => {
  const result = await adminService.auditLogs({
    limit: req.query.limit ? Number(req.query.limit) : 100,
    offset: req.query.offset ? Number(req.query.offset) : 0,
    action: typeof req.query.action === "string" ? req.query.action : undefined,
  });
  ok(res, result);
}))