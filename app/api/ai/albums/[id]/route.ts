import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiAlbums, aiGenerations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { UpdateAlbumSchema } from '@/schemas/ai';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/ai/albums/[id] — 앨범 상세 + 연결된 generations
 */
export async function GET(request: NextRequest, { params }: Params) {
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

    const album = await db.query.aiAlbums.findFirst({
      where: and(eq(aiAlbums.id, id), eq(aiAlbums.userId, user.id)),
    });

    if (!album) {
      return NextResponse.json({ error: '앨범을 찾을 수 없습니다' }, { status: 404 });
    }

    const generations = await db
      .select({
        id: aiGenerations.id,
        originalUrl: aiGenerations.originalUrl,
        style: aiGenerations.style,
        role: aiGenerations.role,
        generatedUrls: aiGenerations.generatedUrls,
        isFavorited: aiGenerations.isFavorited,
        modelId: aiGenerations.modelId,
        createdAt: aiGenerations.createdAt,
      })
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.albumId, id),
          eq(aiGenerations.status, 'COMPLETED')
        )
      )
      .orderBy(desc(aiGenerations.createdAt));

    return NextResponse.json({ success: true, data: { ...album, generations } });
  } catch (error) {
    console.error('Get album error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/ai/albums/[id] — 앨범 업데이트 (이름, images 큐레이션)
 */
export async function PUT(request: NextRequest, { params }: Params) {
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

    // 소유권 확인
    const album = await db.query.aiAlbums.findFirst({
      where: and(eq(aiAlbums.id, id), eq(aiAlbums.userId, user.id)),
      columns: { id: true },
    });

    if (!album) {
      return NextResponse.json({ error: '앨범을 찾을 수 없습니다' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = UpdateAlbumSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.images !== undefined) updateData.images = parsed.data.images;
    if (parsed.data.groups !== undefined) updateData.groups = parsed.data.groups;

    const [updated] = await db
      .update(aiAlbums)
      .set(updateData)
      .where(eq(aiAlbums.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update album error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/albums/[id] — 앨범 삭제
 */
export async function DELETE(request: NextRequest, { params }: Params) {
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

    const album = await db.query.aiAlbums.findFirst({
      where: and(eq(aiAlbums.id, id), eq(aiAlbums.userId, user.id)),
      columns: { id: true },
    });

    if (!album) {
      return NextResponse.json({ error: '앨범을 찾을 수 없습니다' }, { status: 404 });
    }

    await db.delete(aiAlbums).where(eq(aiAlbums.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete album error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
