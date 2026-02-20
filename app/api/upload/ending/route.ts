import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { uploadToS3 } from '@/lib/ai/s3';
import { optimizeForGallery } from '@/lib/ai/image-optimizer';
import { isValidImageBuffer } from '@/lib/ai/validation';
import { GALLERY_CONFIG } from '@/lib/ai/constants';
import { logger } from '@/lib/ai/logger';

/**
 * POST /api/upload/ending
 *
 * 엔딩 섹션 이미지 업로드 (단일 파일)
 *
 * FormData:
 * - file: File
 * - invitationId: string
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. 사용자 조회
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 3. FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const invitationId = formData.get('invitationId') as string;

    if (!invitationId) {
      return NextResponse.json(
        { error: '청첩장 ID가 필요합니다' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: '업로드할 파일이 없습니다' },
        { status: 400 }
      );
    }

    // 4. Invitation 소유권 확인
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, invitationId),
      columns: { id: true, userId: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (invitation.userId !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 5. MIME 타입 검증
    if (!GALLERY_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        { error: `지원하지 않는 형식: ${file.type}` },
        { status: 400 }
      );
    }

    // 6. 파일 크기 검증
    if (file.size > GALLERY_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `파일 크기 초과: ${(file.size / 1024 / 1024).toFixed(1)}MB (최대 10MB)` },
        { status: 400 }
      );
    }

    // 7. 바이너리 시그니처 검증
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isValidImageBuffer(buffer)) {
      return NextResponse.json(
        { error: '유효하지 않은 이미지 파일' },
        { status: 400 }
      );
    }

    // 8. Sharp 최적화 (WebP 변환, 리사이징)
    const optimized = await optimizeForGallery(buffer);

    // 9. S3 업로드
    const { url } = await uploadToS3(optimized, 'image/webp', `ending/${user.id}`);

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    logger.error('Ending image upload failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: '엔딩 이미지 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
