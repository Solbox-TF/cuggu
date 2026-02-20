import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiGenerationJobs } from '@/db/schema';
import { eq, and, lt, inArray } from 'drizzle-orm';
import { releaseCredits } from '@/lib/ai/credits';

/**
 * Stale Job 자동 정리 (Vercel Cron - 매일 04:00 UTC)
 *
 * PENDING/PROCESSING 상태로 1시간 이상 방치된 Job을 찾아
 * 미사용 크레딧을 환불하고 상태를 업데이트한다.
 *
 * 주요 경로(stream route)에서 이미 자동 완료 처리하지만,
 * 네트워크 오류/서버 크래시 등 예외 상황의 안전망 역할.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  let processed = 0;
  let refunded = 0;

  try {
    // createdAt 기준 (updatedAt 컬럼 없음)
    const staleJobs = await db.query.aiGenerationJobs.findMany({
      where: and(
        inArray(aiGenerationJobs.status, ['PENDING', 'PROCESSING']),
        lt(aiGenerationJobs.createdAt, oneHourAgo)
      ),
      columns: {
        id: true,
        userId: true,
        completedImages: true,
        failedImages: true,
        totalImages: true,
        creditsReserved: true,
        creditsUsed: true,
      },
    });

    for (const job of staleJobs) {
      const finalStatus = job.completedImages === 0 ? 'FAILED'
                        : job.completedImages >= job.totalImages ? 'COMPLETED' : 'PARTIAL';
      const unusedCredits = job.creditsReserved - job.creditsUsed;

      if (unusedCredits > 0 && job.userId) {
        await releaseCredits(
          job.userId, unusedCredits, job.id,
          `생성 시간 초과로 자동 환불 (${unusedCredits}장)`
        );
        refunded += unusedCredits;
      }

      await db.update(aiGenerationJobs).set({
        status: finalStatus,
        completedAt: now,
      }).where(eq(aiGenerationJobs.id, job.id));

      processed++;
    }

    console.log(
      `[stale-jobs] processed: ${processed}, credits refunded: ${refunded}`
    );

    return NextResponse.json({
      success: true,
      processed,
      refunded,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[stale-jobs] 실패:', error);
    return NextResponse.json(
      { error: 'Stale job 정리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
