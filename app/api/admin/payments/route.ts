import { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import {
  withErrorHandler,
  successResponse,
  validateQuery,
} from "@/lib/api-utils";
import {
  AdminPaymentsQuerySchema,
  type AdminPaymentItem,
  type PaginationMeta,
} from "@/schemas/admin";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const query = validateQuery(req, AdminPaymentsQuerySchema);
  const { page, pageSize, status, type, userId, startDate, endDate } = query;

  // WHERE 조건 구성
  const conditions = [];
  if (status) {
    conditions.push(eq(payments.status, status));
  }
  if (type) {
    conditions.push(eq(payments.type, type));
  }
  if (userId) {
    conditions.push(eq(payments.userId, userId));
  }
  if (startDate) {
    conditions.push(gte(payments.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(payments.createdAt, new Date(endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 총 개수 및 합계
  const [summaryResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
    })
    .from(payments)
    .where(whereClause);

  const total = summaryResult.count;
  const totalPages = Math.ceil(total / pageSize);

  // 결제 목록 조회 (유저 정보 포함)
  const paymentList = await db
    .select({
      id: payments.id,
      userId: payments.userId,
      type: payments.type,
      method: payments.method,
      amount: payments.amount,
      creditsGranted: payments.creditsGranted,
      status: payments.status,
      orderId: payments.orderId,
      createdAt: payments.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .where(whereClause)
    .orderBy(sql`${payments.createdAt} DESC`)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const paymentItems: AdminPaymentItem[] = paymentList.map((p) => ({
    id: p.id,
    user: {
      id: p.userId,
      email: p.userEmail,
      name: p.userName,
    },
    type: p.type,
    method: p.method,
    amount: p.amount,
    creditsGranted: p.creditsGranted,
    status: p.status,
    orderId: p.orderId,
    createdAt: p.createdAt.toISOString(),
  }));

  const pagination: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages,
  };

  return successResponse({
    payments: paymentItems,
    pagination,
    summary: {
      totalAmount: summaryResult.totalAmount,
      count: total,
    },
  });
});
