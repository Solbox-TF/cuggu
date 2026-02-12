import { z } from "zod";

// ============================================================
// Admin User Action Schemas
// ============================================================

export const GrantCreditsActionSchema = z.object({
  action: z.literal("grant_credits"),
  userId: z.string().cuid2(),
  credits: z.number().int().min(1).max(100),
});

export const SetPremiumActionSchema = z.object({
  action: z.literal("set_premium"),
  userId: z.string().cuid2(),
});

export const SetFreeActionSchema = z.object({
  action: z.literal("set_free"),
  userId: z.string().cuid2(),
});

export const SetAdminActionSchema = z.object({
  action: z.literal("set_admin"),
  userId: z.string().cuid2(),
});

export const SetUserActionSchema = z.object({
  action: z.literal("set_user"),
  userId: z.string().cuid2(),
});

export const AdminUserActionSchema = z.discriminatedUnion("action", [
  GrantCreditsActionSchema,
  SetPremiumActionSchema,
  SetFreeActionSchema,
  SetAdminActionSchema,
  SetUserActionSchema,
]);

export type AdminUserAction = z.infer<typeof AdminUserActionSchema>;

// ============================================================
// Query Schemas
// ============================================================

export const AdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  plan: z.enum(["FREE", "PREMIUM"]).optional(),
  sortBy: z.enum(["createdAt", "aiCredits"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;

export const AdminPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
  type: z
    .enum(["PREMIUM_UPGRADE", "AI_CREDITS", "AI_CREDITS_BUNDLE"])
    .optional(),
  userId: z.string().cuid2().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AdminPaymentsQuery = z.infer<typeof AdminPaymentsQuerySchema>;

// ============================================================
// Response Types
// ============================================================

export interface AdminStatsResponse {
  users: {
    total: number;
    premium: number;
    newThisMonth: number;
  };
  ai: {
    totalGenerations: number;
    totalCost: number;
    thisMonthGenerations: number;
    thisMonthCost: number;
  };
  aiThemes: {
    totalThemes: number;
    totalCost: number;
    thisMonthThemes: number;
    thisMonthCost: number;
    safelistFailRate: number;
  };
  revenue: {
    totalAmount: number;
    thisMonthAmount: number;
    completedPayments: number;
  };
  invitations: {
    total: number;
    published: number;
    draft: number;
  };
}

export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  premiumPlan: "FREE" | "PREMIUM";
  aiCredits: number;
  createdAt: string;
  _count: {
    invitations: number;
    aiGenerations: number;
  };
}

export interface AdminPaymentItem {
  id: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  type: string;
  method: string;
  amount: number;
  creditsGranted: number | null;
  status: string;
  orderId: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
