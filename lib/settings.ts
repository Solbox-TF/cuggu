import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * appSettings 테이블에서 설정값 조회
 */
export async function getAppSetting<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, key),
  });
  if (!row) return defaultValue;
  return row.value as T;
}

/**
 * appSettings 테이블에 설정값 upsert
 */
export async function setAppSetting(
  key: string,
  value: unknown,
  meta: { category: string; label: string; description?: string }
): Promise<void> {
  await db
    .insert(appSettings)
    .values({
      key,
      value,
      category: meta.category,
      label: meta.label,
      description: meta.description ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    });
}

/**
 * 신규 회원가입 허용 여부
 * 키가 없으면 기본값 false (차단)
 */
export async function isRegistrationEnabled(): Promise<boolean> {
  return getAppSetting<boolean>("registration_enabled", false);
}
