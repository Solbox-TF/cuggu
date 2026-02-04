/**
 * 예시 API Route - Zod 검증 사용법
 *
 * 이 파일은 참고용 예시입니다. 실제 구현 시 이 패턴을 따라주세요.
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandler,
  validateRequest,
  validateQuery,
  successResponse,
  NotFoundError,
} from '@/lib/api-utils';
import { CreateInvitationSchema, PaginationQuerySchema } from '@/schemas';

/**
 * POST /api/example
 *
 * 청첩장 생성 예시 (실제로는 /api/invitations에 구현)
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. 요청 body 검증 (Zod)
  const data = await validateRequest(req, CreateInvitationSchema);

  // 2. 인증 확인 (TODO: NextAuth.js 세션)
  // const session = await requireAuth(req);

  // 3. 비즈니스 로직
  // const invitation = await db.insert(invitations).values({
  //   ...data,
  //   userId: session.user.id,
  // });

  // 4. 성공 응답
  return successResponse(
    {
      id: 'example-id',
      ...data,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    },
    '청첩장이 생성되었습니다',
    201
  );
});

/**
 * GET /api/example?page=1&pageSize=20
 *
 * 청첩장 목록 조회 예시
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  // 1. 쿼리 파라미터 검증 (Zod)
  const query = validateQuery(req, PaginationQuerySchema);

  // 2. 인증 확인
  // const session = await requireAuth(req);

  // 3. 비즈니스 로직
  // const invitations = await db.query.invitations.findMany({
  //   where: eq(invitations.userId, session.user.id),
  //   limit: query.pageSize,
  //   offset: (query.page - 1) * query.pageSize,
  // });

  // 4. 성공 응답
  return successResponse({
    invitations: [],
    total: 0,
    page: query.page,
    pageSize: query.pageSize,
  });
});

/**
 * PATCH /api/example/[id]
 *
 * 청첩장 업데이트 예시
 */
export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    // 1. URL 파라미터 검증
    const id = params.id;

    // 2. 요청 body 검증
    // const data = await validateRequest(req, UpdateInvitationRequestSchema);

    // 3. 인증 확인
    // const session = await requireAuth(req);

    // 4. 리소스 존재 확인
    // const invitation = await db.query.invitations.findFirst({
    //   where: eq(invitations.id, id),
    // });
    // if (!invitation) {
    //   throw new NotFoundError('청첩장을 찾을 수 없습니다');
    // }

    // 5. 권한 확인
    // if (invitation.userId !== session.user.id) {
    //   throw new ForbiddenError();
    // }

    // 6. 업데이트
    // await db.update(invitations).set(data).where(eq(invitations.id, id));

    // 7. 성공 응답
    return successResponse(
      { id, updated: true },
      '청첩장이 업데이트되었습니다'
    );
  }
);

/**
 * DELETE /api/example/[id]
 *
 * 청첩장 삭제 예시
 */
export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const id = params.id;

    // 인증, 권한 확인, 삭제 로직...

    return successResponse({ id, deleted: true }, '청첩장이 삭제되었습니다');
  }
);
