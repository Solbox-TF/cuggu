import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ToggleFavoriteSchema } from '@/schemas/ai';

/**
 * PATCH /api/ai/generations/[id]
 * 즐겨찾기 토글
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const parsed = ToggleFavoriteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }
    const { isFavorited } = parsed.data;

    const result = await db
      .update(aiGenerations)
      .set({ isFavorited })
      .where(
        and(
          eq(aiGenerations.id, id),
          eq(aiGenerations.userId, user.id)
        )
      )
      .returning({ id: aiGenerations.id, isFavorited: aiGenerations.isFavorited });

    if (result.length === 0) {
      return NextResponse.json({ error: '생성 기록을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Patch generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
