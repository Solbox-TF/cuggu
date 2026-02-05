import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, invitations, aiGenerations } from "@/db/schema";
import { eq, sql, ilike, or, asc, desc, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import {
  withErrorHandler,
  successResponse,
  validateRequest,
  validateQuery,
  NotFoundError,
} from "@/lib/api-utils";
import {
  AdminUsersQuerySchema,
  AdminUserActionSchema,
  type AdminUserItem,
  type PaginationMeta,
} from "@/schemas/admin";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const query = validateQuery(req, AdminUsersQuerySchema);
  const { page, pageSize, search, plan, sortBy, sortOrder } = query;

  // WHERE 조건 구성
  const conditions = [];
  if (search) {
    conditions.push(
      or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`))
    );
  }
  if (plan) {
    conditions.push(eq(users.premiumPlan, plan));
  }

  // 정렬
  const orderBy =
    sortOrder === "asc"
      ? asc(users[sortBy])
      : desc(users[sortBy]);

  // 총 개수
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined);

  const total = countResult.count;
  const totalPages = Math.ceil(total / pageSize);

  // 유저 목록 조회
  const userList = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      premiumPlan: users.premiumPlan,
      aiCredits: users.aiCredits,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // 각 유저의 청첩장/AI생성 카운트 조회
  const userIds = userList.map((u) => u.id);

  const invitationCounts = userIds.length > 0
    ? await db
        .select({
          userId: invitations.userId,
          count: sql<number>`count(*)::int`,
        })
        .from(invitations)
        .where(inArray(invitations.userId, userIds))
        .groupBy(invitations.userId)
    : [];

  const aiCounts = userIds.length > 0
    ? await db
        .select({
          userId: aiGenerations.userId,
          count: sql<number>`count(*)::int`,
        })
        .from(aiGenerations)
        .where(inArray(aiGenerations.userId, userIds))
        .groupBy(aiGenerations.userId)
    : [];

  const invitationCountMap = new Map(
    invitationCounts.map((c) => [c.userId, c.count])
  );
  const aiCountMap = new Map(aiCounts.map((c) => [c.userId, c.count]));

  const usersWithCounts: AdminUserItem[] = userList.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    premiumPlan: u.premiumPlan,
    aiCredits: u.aiCredits,
    createdAt: u.createdAt.toISOString(),
    _count: {
      invitations: invitationCountMap.get(u.id) || 0,
      aiGenerations: aiCountMap.get(u.id) || 0,
    },
  }));

  const pagination: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages,
  };

  return successResponse({ users: usersWithCounts, pagination });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const body = await validateRequest(req, AdminUserActionSchema);

  // 유저 존재 확인
  const user = await db.query.users.findFirst({
    where: eq(users.id, body.userId),
    columns: { id: true, aiCredits: true, premiumPlan: true },
  });

  if (!user) {
    throw new NotFoundError("사용자를 찾을 수 없습니다");
  }

  switch (body.action) {
    case "grant_credits": {
      const newCredits = user.aiCredits + body.credits;
      await db
        .update(users)
        .set({ aiCredits: newCredits, updatedAt: new Date() })
        .where(eq(users.id, body.userId));

      return successResponse({
        userId: body.userId,
        action: body.action,
        result: { newCredits },
      });
    }

    case "set_premium": {
      await db
        .update(users)
        .set({ premiumPlan: "PREMIUM", updatedAt: new Date() })
        .where(eq(users.id, body.userId));

      return successResponse({
        userId: body.userId,
        action: body.action,
        result: { newPlan: "PREMIUM" as const },
      });
    }

    case "set_free": {
      await db
        .update(users)
        .set({ premiumPlan: "FREE", updatedAt: new Date() })
        .where(eq(users.id, body.userId));

      return successResponse({
        userId: body.userId,
        action: body.action,
        result: { newPlan: "FREE" as const },
      });
    }
  }
});
