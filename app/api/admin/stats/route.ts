import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, aiGenerations, payments, invitations } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { withErrorHandler, successResponse } from "@/lib/api-utils";
import type { AdminStatsResponse } from "@/schemas/admin";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  // 유저 통계
  const [userStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      premium: sql<number>`count(*) filter (where ${users.premiumPlan} = 'PREMIUM')::int`,
      newThisMonth: sql<number>`count(*) filter (where ${users.createdAt} >= date_trunc('month', now()))::int`,
    })
    .from(users);

  // AI 통계
  const [aiStats] = await db
    .select({
      totalGenerations: sql<number>`count(*)::int`,
      totalCost: sql<number>`coalesce(sum(${aiGenerations.cost}), 0)::real`,
      thisMonthGenerations: sql<number>`count(*) filter (where ${aiGenerations.createdAt} >= date_trunc('month', now()))::int`,
      thisMonthCost: sql<number>`coalesce(sum(${aiGenerations.cost}) filter (where ${aiGenerations.createdAt} >= date_trunc('month', now())), 0)::real`,
    })
    .from(aiGenerations);

  // 매출 통계
  const [revenueStats] = await db
    .select({
      totalAmount: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'COMPLETED'), 0)::int`,
      thisMonthAmount: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'COMPLETED' and ${payments.createdAt} >= date_trunc('month', now())), 0)::int`,
      completedPayments: sql<number>`count(*) filter (where ${payments.status} = 'COMPLETED')::int`,
    })
    .from(payments);

  // 청첩장 통계
  const [invitationStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${invitations.status} = 'PUBLISHED')::int`,
      draft: sql<number>`count(*) filter (where ${invitations.status} = 'DRAFT')::int`,
    })
    .from(invitations);

  const stats: AdminStatsResponse = {
    users: {
      total: userStats.total,
      premium: userStats.premium,
      newThisMonth: userStats.newThisMonth,
    },
    ai: {
      totalGenerations: aiStats.totalGenerations,
      totalCost: aiStats.totalCost,
      thisMonthGenerations: aiStats.thisMonthGenerations,
      thisMonthCost: aiStats.thisMonthCost,
    },
    revenue: {
      totalAmount: revenueStats.totalAmount,
      thisMonthAmount: revenueStats.thisMonthAmount,
      completedPayments: revenueStats.completedPayments,
    },
    invitations: {
      total: invitationStats.total,
      published: invitationStats.published,
      draft: invitationStats.draft,
    },
  };

  return successResponse(stats);
});
