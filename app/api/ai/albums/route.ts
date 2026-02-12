import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiAlbums, aiGenerations } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { CreateAlbumSchema } from '@/schemas/ai';
import { createId } from '@paralleldrive/cuid2';

/**
 * POST /api/ai/albums — 앨범 생성 (유저당 1개 제한)
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = CreateAlbumSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청' },
        { status: 400 }
      );
    }

    const defaultGroups = [
      { id: createId(), name: '기본 그룹', sortOrder: 0, isDefault: true },
    ];

    const [album] = await db
      .insert(aiAlbums)
      .values({
        userId: user.id,
        name: parsed.data.name,
        snapType: parsed.data.snapType,
        groups: defaultGroups,
      })
      .returning();

    return NextResponse.json({ success: true, data: album }, { status: 201 });
  } catch (error) {
    console.error('Create album error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/ai/albums — 내 앨범 목록 (MVP: 1개)
 */
export async function GET() {
  try {
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

    const albums = await db
      .select()
      .from(aiAlbums)
      .where(eq(aiAlbums.userId, user.id))
      .orderBy(desc(aiAlbums.createdAt));

    // 각 앨범의 generation 수도 같이 반환
    const albumsWithCounts = await Promise.all(
      albums.map(async (album) => {
        const generations = await db
          .select({
            id: aiGenerations.id,
            style: aiGenerations.style,
            role: aiGenerations.role,
            generatedUrls: aiGenerations.generatedUrls,
            createdAt: aiGenerations.createdAt,
          })
          .from(aiGenerations)
          .where(
            and(
              eq(aiGenerations.albumId, album.id),
              eq(aiGenerations.status, 'COMPLETED')
            )
          )
          .orderBy(desc(aiGenerations.createdAt));

        return { ...album, generations };
      })
    );

    return NextResponse.json({ success: true, data: albumsWithCounts });
  } catch (error) {
    console.error('Get albums error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
