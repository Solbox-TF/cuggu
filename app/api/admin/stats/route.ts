import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, aiGenerations, aiThemes, payments, invitations } from "@/db/schema";
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

  // AI 테마 통계
  const [themeStats] = await db
    .select({
      totalThemes: sql<number>`count(*)::int`,
      totalThemeCost: sql<number>`coalesce(sum(${aiThemes.cost}), 0)::real`,
      thisMonthThemes: sql<number>`count(*) filter (where ${aiThemes.createdAt} >= date_trunc('month', now()))::int`,
      thisMonthThemeCost: sql<number>`coalesce(sum(${aiThemes.cost}) filter (where ${aiThemes.createdAt} >= date_trunc('month', now())), 0)::real`,
      safelistFailRate: sql<number>`case when count(*) > 0 then round(count(*) filter (where ${aiThemes.status} = 'safelist_failed')::numeric / count(*)::numeric * 100) else 0 end::int`,
    })
    .from(aiThemes);

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
    aiThemes: {
      totalThemes: themeStats.totalThemes,
      totalCost: themeStats.totalThemeCost,
      thisMonthThemes: themeStats.thisMonthThemes,
      thisMonthCost: themeStats.thisMonthThemeCost,
      safelistFailRate: themeStats.safelistFailRate,
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
