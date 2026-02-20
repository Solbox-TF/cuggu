import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq, and, lt, inArray } from 'drizzle-orm';
import { extractS3Key, deleteFromS3 } from '@/lib/ai/s3';

/**
 * 만료 청첩장 자동 정리 (Vercel Cron - 매일 03:00 UTC)
 *
 * 1단계: EXPIRED + 30일 경과 → DELETED (soft delete)
 * 2단계: DELETED + 30일 경과 → hard delete (DB + S3)
 */
export async function GET(req: NextRequest) {
  // CRON_SECRET 인증
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let softDeleted = 0;
  let hardDeleted = 0;
  let s3Deleted = 0;

  try {
    // 1단계: EXPIRED + 30일 경과 → soft delete (DELETED)
    const expiredInvitations = await db.query.invitations.findMany({
      where: and(
        eq(invitations.status, 'EXPIRED'),
        lt(invitations.expiresAt, thirtyDaysAgo)
      ),
      columns: { id: true },
    });

    if (expiredInvitations.length > 0) {
      const expiredIds = expiredInvitations.map((inv) => inv.id);
      await db
        .update(invitations)
        .set({ status: 'DELETED', updatedAt: now })
        .where(inArray(invitations.id, expiredIds));
      softDeleted = expiredIds.length;
    }

    // 2단계: DELETED + 30일 경과 → hard delete
    const deletedInvitations = await db.query.invitations.findMany({
      where: and(
        eq(invitations.status, 'DELETED'),
        lt(invitations.updatedAt, thirtyDaysAgo)
      ),
      columns: {
        id: true,
        galleryImages: true,
        aiPhotoUrl: true,
      },
    });

    if (deletedInvitations.length > 0) {
      // S3 이미지 삭제
      const s3Keys = collectS3Keys(deletedInvitations);
      if (s3Keys.length > 0) {
        s3Deleted = await deleteFromS3(s3Keys);
      }

      // DB hard delete (rsvps는 cascade로 자동 삭제)
      const deletedIds = deletedInvitations.map((inv) => inv.id);
      await db
        .delete(invitations)
        .where(inArray(invitations.id, deletedIds));
      hardDeleted = deletedIds.length;
    }

    console.log(
      `[Cleanup] soft-deleted: ${softDeleted}, hard-deleted: ${hardDeleted}, s3-deleted: ${s3Deleted}`
    );

    return NextResponse.json({
      success: true,
      softDeleted,
      hardDeleted,
      s3Deleted,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[Cleanup] 실패:', error);
    return NextResponse.json(
      { error: '정리 작업 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 청첩장 목록에서 S3 key 추출
 */
function collectS3Keys(
  rows: { galleryImages: string[] | null; aiPhotoUrl: string | null }[]
): string[] {
  const keys: string[] = [];

  for (const row of rows) {
    const urls: string[] = [];
    if (row.galleryImages) urls.push(...row.galleryImages);
    if (row.aiPhotoUrl) urls.push(row.aiPhotoUrl);

    for (const url of urls) {
      const key = extractS3Key(url);
      if (key) keys.push(key);
    }
  }

  return keys;
}
