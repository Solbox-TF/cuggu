import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { setAppSetting } from "@/lib/settings";
import { z } from "zod";

const PatchSchema = z.object({
  key: z.string().min(1).max(128),
  value: z.unknown(),
  category: z.string().min(1).max(64),
  label: z.string().min(1).max(255),
  description: z.string().optional(),
});

/**
 * GET /api/admin/settings?category=auth
 * 전체 또는 카테고리별 설정 조회
 */
export const GET = withErrorHandler(async (req) => {
  await requireAdmin();

  const category = req.nextUrl.searchParams.get("category");

  let rows;
  if (category) {
    rows = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.category, category));
  } else {
    rows = await db.select().from(appSettings);
  }

  return successResponse(rows);
});

/**
 * PATCH /api/admin/settings
 * 설정값 upsert
 */
export const PATCH = withErrorHandler(async (req) => {
  await requireAdmin();

  const body = await req.json();
  const data = PatchSchema.parse(body);

  await setAppSetting(data.key, data.value, {
    category: data.category,
    label: data.label,
    description: data.description,
  });

  return successResponse({ key: data.key, value: data.value });
});
