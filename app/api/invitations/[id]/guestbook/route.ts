import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations, guestbookEntries } from '@/db/schema';
import { eq, and, desc, lt, sql, count } from 'drizzle-orm';
import { SubmitGuestbookEntrySchema } from '@/schemas/guestbook';
import { checkProfanityAI } from '@/lib/profanity-filter.server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// POST /api/invitations/[id]/guestbook - 방명록 작성 (비인증)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Rate limit: 3회/분
    const ip = getClientIp(req);
    const { allowed } = await rateLimit(
      `ratelimit:guestbook:${ip}:${id}`,
      3,
      60
    );
    if (!allowed) {
      return NextResponse.json(
        { error: '방명록 작성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // 청첩장 확인
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '방명록을 작성할 수 없는 청첩장입니다' },
        { status: 400 }
      );
    }

    // enabledSections.guestbook 설정 확인
    const enabledSections = (invitation.extendedData as any)?.enabledSections || {};
    if (enabledSections.guestbook !== true) {
      return NextResponse.json(
        { error: '방명록이 비활성화된 청첩장입니다' },
        { status: 400 }
      );
    }

    // Zod 파싱 (로컬 비속어 필터 포함)
    const body = await req.json();
    const parsed = SubmitGuestbookEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // OpenAI Moderation 2차 검증 (다국어)
    const aiResult = await checkProfanityAI(`${data.name} ${data.message}`);
    if (aiResult.hasProfanity) {
      return NextResponse.json(
        { error: '부적절한 표현이 포함되어 있습니다' },
        { status: 400 }
      );
    }

    // DB insert
    const [created] = await db
      .insert(guestbookEntries)
      .values({
        invitationId: id,
        name: data.name,
        message: data.message,
        isPrivate: data.isPrivate,
      })
      .returning({ id: guestbookEntries.id, createdAt: guestbookEntries.createdAt });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.error('방명록 작성 실패:', error);
    return NextResponse.json(
      { error: '방명록 작성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET /api/invitations/[id]/guestbook - 방명록 조회
// 비인증: 공개 entries만 (커서 페이지네이션)
// 인증+소유자: 전체 entries + stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');
    const limitParam = parseInt(url.searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(limitParam, 1), 50);

    // 청첩장 확인
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const isOwner = session?.user && invitation.userId === session.user.id;

    if (isOwner) {
      // 소유자: 전체 entries + stats
      const entries = await db.query.guestbookEntries.findMany({
        where: eq(guestbookEntries.invitationId, id),
        orderBy: [desc(guestbookEntries.createdAt)],
      });

      let hiddenCount = 0;
      let privateCount = 0;
      for (const entry of entries) {
        if (entry.isHidden) hiddenCount++;
        if (entry.isPrivate) privateCount++;
      }

      return NextResponse.json({
        success: true,
        data: {
          entries: entries.map((e) => ({
            id: e.id,
            name: e.name,
            message: e.message,
            isPrivate: e.isPrivate,
            isHidden: e.isHidden,
            createdAt: e.createdAt.toISOString(),
          })),
          total: entries.length,
          hiddenCount,
          privateCount,
        },
      });
    }

    // 비인증/비소유자: 공개 entries만 (커서 페이지네이션)
    const conditions = [
      eq(guestbookEntries.invitationId, id),
      eq(guestbookEntries.isPrivate, false),
      eq(guestbookEntries.isHidden, false),
    ];

    if (cursor) {
      conditions.push(lt(guestbookEntries.createdAt, new Date(cursor)));
    }

    const entries = await db
      .select()
      .from(guestbookEntries)
      .where(and(...conditions))
      .orderBy(desc(guestbookEntries.createdAt))
      .limit(limit + 1);

    const hasMore = entries.length > limit;
    const sliced = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore
      ? sliced[sliced.length - 1].createdAt.toISOString()
      : null;

    // 총 공개 메시지 수
    const [totalResult] = await db
      .select({ value: count() })
      .from(guestbookEntries)
      .where(
        and(
          eq(guestbookEntries.invitationId, id),
          eq(guestbookEntries.isPrivate, false),
          eq(guestbookEntries.isHidden, false)
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        entries: sliced.map((e) => ({
          id: e.id,
          name: e.name,
          message: e.message,
          createdAt: e.createdAt.toISOString(),
        })),
        nextCursor,
        total: totalResult?.value ?? 0,
      },
    });
  } catch (error) {
    console.error('방명록 조회 실패:', error);
    return NextResponse.json(
      { error: '방명록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
