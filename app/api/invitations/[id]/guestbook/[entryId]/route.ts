import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations, guestbookEntries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PatchGuestbookEntrySchema } from '@/schemas/guestbook';

// PATCH /api/invitations/[id]/guestbook/[entryId] - 숨김 토글 (소유자)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 청첩장 소유권 확인
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
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

    // 방명록 항목 확인 (IDOR 방지)
    const entry = await db.query.guestbookEntries.findFirst({
      where: and(
        eq(guestbookEntries.id, entryId),
        eq(guestbookEntries.invitationId, id)
      ),
    });

    if (!entry) {
      return NextResponse.json(
        { error: '방명록 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = PatchGuestbookEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: parsed.error.issues },
        { status: 400 }
      );
    }

    await db
      .update(guestbookEntries)
      .set({ isHidden: parsed.data.isHidden })
      .where(eq(guestbookEntries.id, entryId));

    return NextResponse.json({
      success: true,
      message: parsed.data.isHidden ? '메시지를 숨겼습니다' : '메시지를 다시 표시합니다',
    });
  } catch (error) {
    console.error('방명록 수정 실패:', error);
    return NextResponse.json(
      { error: '방명록 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE /api/invitations/[id]/guestbook/[entryId] - 완전 삭제 (소유자)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 청첩장 소유권 확인
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
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

    // 방명록 항목 확인 (IDOR 방지)
    const entry = await db.query.guestbookEntries.findFirst({
      where: and(
        eq(guestbookEntries.id, entryId),
        eq(guestbookEntries.invitationId, id)
      ),
    });

    if (!entry) {
      return NextResponse.json(
        { error: '방명록 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await db.delete(guestbookEntries).where(eq(guestbookEntries.id, entryId));

    return NextResponse.json({
      success: true,
      message: '방명록 항목이 삭제되었습니다',
    });
  } catch (error) {
    console.error('방명록 삭제 실패:', error);
    return NextResponse.json(
      { error: '방명록 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
