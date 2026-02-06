import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UnauthorizedError, ForbiddenError } from "@/lib/api-utils";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN";
};

/**
 * Admin 권한 확인 및 유저 정보 반환
 * API route에서 사용
 *
 * @throws UnauthorizedError - 로그인 안됨
 * @throws ForbiddenError - Admin 아님
 */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await auth();

  if (!session?.user?.email) {
    throw new UnauthorizedError("로그인이 필요합니다");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("사용자 정보를 찾을 수 없습니다");
  }

  if (user.role !== "ADMIN") {
    throw new ForbiddenError("관리자 권한이 필요합니다");
  }

  return user as AdminUser;
}

/**
 * Admin 여부만 확인 (boolean)
 * 서버 컴포넌트에서 조건부 렌더링용
 */
export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
