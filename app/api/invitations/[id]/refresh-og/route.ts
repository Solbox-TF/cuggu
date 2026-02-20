import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { refreshKakaoOgCache, getInvitationUrl } from '@/lib/kakao-og';

/**
 * POST /api/invitations/[id]/refresh-og
 *
 * 카카오톡 OG 캐시 수동 갱신
 * PUBLISHED 상태인 청첩장만 가능
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
      columns: { id: true, userId: true, status: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (invitation.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '발행된 청첩장만 캐시를 갱신할 수 있습니다' },
        { status: 400 }
      );
    }

    const targetUrl = getInvitationUrl(id);
    const success = await refreshKakaoOgCache(targetUrl);

    return NextResponse.json({
      success,
      message: success
        ? '카카오톡 미리보기가 갱신되었습니다'
        : '캐시 갱신에 실패했습니다. 잠시 후 다시 시도해주세요.',
    });
  } catch (error) {
    console.error('OG 캐시 갱신 실패:', error);
    return NextResponse.json(
      { error: 'OG 캐시 갱신 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
