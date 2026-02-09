import { db } from '@/db';
import { aiThemes, users } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/admin';
import { withErrorHandler, successResponse, validateQuery } from '@/lib/api-utils';
import { z } from 'zod';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['completed', 'safelist_failed']).optional(),
});

export const GET = withErrorHandler(async (req) => {
  await requireAdmin();

  const { page, pageSize, status } = validateQuery(req, QuerySchema);
  const offset = (page - 1) * pageSize;

  const whereClause = status ? eq(aiThemes.status, status) : undefined;

  const [themes, [countResult], [statsResult]] = await Promise.all([
    db
      .select({
        id: aiThemes.id,
        prompt: aiThemes.prompt,
        status: aiThemes.status,
        failReason: aiThemes.failReason,
        inputTokens: aiThemes.inputTokens,
        outputTokens: aiThemes.outputTokens,
        cost: aiThemes.cost,
        creditsUsed: aiThemes.creditsUsed,
        createdAt: aiThemes.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(aiThemes)
      .innerJoin(users, eq(aiThemes.userId, users.id))
      .where(whereClause)
      .orderBy(desc(aiThemes.createdAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiThemes)
      .where(whereClause),

    db
      .select({
        totalCount: sql<number>`count(*)::int`,
        totalCost: sql<number>`coalesce(sum(${aiThemes.cost}), 0)::real`,
        failedCount: sql<number>`count(*) filter (where ${aiThemes.status} = 'safelist_failed')::int`,
      })
      .from(aiThemes),
  ]);

  const total = countResult.count;

  return successResponse({
    themes,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    stats: {
      totalCount: statsResult.totalCount,
      totalCost: statsResult.totalCost,
      failRate: statsResult.totalCount > 0
        ? Math.round((statsResult.failedCount / statsResult.totalCount) * 100)
        : 0,
    },
  });
});
