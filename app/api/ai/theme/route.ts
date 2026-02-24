import { after, NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiThemes, invitations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { generateTheme } from '@/lib/ai/theme-generation';
import type { ThemeUserIntent } from '@/lib/ai/theme-generation';
import type { ThemeSectionPlan } from '@/lib/ai/theme-sections';
import { createSectionPlanFromInvitation } from '@/lib/ai/theme-sections';
import { DEFAULT_THEME_CONFIG, findThemeModelById } from '@/lib/ai/theme-models';
import type { AIThemeModel, ThemeMode, ThemeGenerationConfig } from '@/lib/ai/theme-models';
import { extractThemeContext } from '@/lib/ai/theme-context';
import type { ThemeContextResult } from '@/lib/ai/theme-context';
import { checkThemeClasses } from '@/lib/templates/safelist';
import { getAppSetting } from '@/lib/settings';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const QUEUED_MARKER = '__AI_THEME_QUEUED__';
const PROCESSING_MARKER = '__AI_THEME_PROCESSING__';

// ── 모델 해석 ──

async function resolveThemeModel(mode: ThemeMode = 'fast'): Promise<AIThemeModel> {
  const config = await getAppSetting<ThemeGenerationConfig>(
    'theme_generation_config',
    DEFAULT_THEME_CONFIG,
  );

  const modelId = mode === 'quality' ? config.qualityModelId : config.fastModelId;
  const model = findThemeModelById(modelId);

  if (!model) {
    // fallback: 설정이 잘못됐으면 기본값 사용
    const fallbackId = mode === 'quality'
      ? DEFAULT_THEME_CONFIG.qualityModelId
      : DEFAULT_THEME_CONFIG.fastModelId;
    const fallback = findThemeModelById(fallbackId);
    if (!fallback) {
      throw { status: 500, message: '테마 모델 설정 오류' };
    }
    return fallback;
  }

  return model;
}

// ── POST: 테마 생성 ──

const CreateRequestSchema = z.object({
  prompt: z.string().min(2, '프롬프트는 2자 이상 입력해주세요').max(250, '프롬프트는 250자 이내로 입력해주세요'),
  invitationId: z.string().optional(),
  mode: z.enum(['fast', 'quality']).optional(),
  background: z.boolean().optional(),
  userIntent: z.object({
    tone: z.enum(['romantic', 'modern', 'classic', 'natural', 'minimal', 'luxury']).optional(),
    colorPreference: z.string().max(80).optional(),
    colorAvoid: z.string().max(80).optional(),
    animationIntensity: z.enum(['none', 'subtle', 'medium']).optional(),
    readabilityPriority: z.enum(['balanced', 'readability']).optional(),
  }).optional(),
  sectionPlan: z.object({
    sections: z.array(z.object({
      id: z.enum(['cover', 'greeting', 'parents', 'ceremony', 'map', 'gallery', 'accounts', 'rsvp', 'ending', 'guestbook']),
      enabled: z.boolean(),
      required: z.boolean(),
      dataSummary: z.string().max(180).optional(),
      uxGoal: z.string().max(180).optional(),
    })).max(12),
  }).optional(),
});

export async function POST(request: NextRequest) {
  let userId: string | undefined;

  try {
    // 1. 인증
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 2. 사용자 조회
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    userId = user.id;

    // 3. 요청 파싱
    const body = await request.json();
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청입니다' },
        { status: 400 }
      );
    }

    // 4. 모델 해석 (mode 기반)
    let themeModel: AIThemeModel;
    try {
      themeModel = await resolveThemeModel(parsed.data.mode);
    } catch (err: any) {
      if (err.status && err.message) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    // 5. Rate limiting (10회/시간)
    const rateLimitResult = await rateLimit(`ratelimit:ai-theme:${user.id}`, 10, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: '테마 생성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // 6. 크레딧 확인
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      const { hasCredits, balance } = checkCreditsFromUser(user);
      if (!hasCredits) {
        return NextResponse.json(
          { error: '크레딧이 부족합니다', balance },
          { status: 402 }
        );
      }
    }

    // 7. 크레딧 차감 (감사 추적 포함)
    const themeId = createId();
    const creditBalance = await deductCredits(user.id, 1, {
      referenceType: 'THEME',
      referenceId: themeId,
      description: 'AI 테마 생성',
    });
    const background = parsed.data.background ?? true;

    // 7.5. 청첩장 컨텍스트 추출 (invitationId가 있을 때만)
    let themeContext: ThemeContextResult | null = null;
    let sectionPlan: ThemeSectionPlan | null = parsed.data.sectionPlan ?? null;
    if (parsed.data.invitationId) {
      try {
        const inv = await db.query.invitations.findFirst({
          where: and(
            eq(invitations.id, parsed.data.invitationId),
            eq(invitations.userId, user.id),
          ),
          columns: {
            groomName: true,
            brideName: true,
            weddingDate: true,
            venueName: true,
            venueAddress: true,
            introMessage: true,
            galleryImages: true,
            extendedData: true,
          },
        });

        if (inv) {
          themeContext = extractThemeContext({
            weddingDate: inv.weddingDate,
            venueName: inv.venueName,
            introMessage: inv.introMessage,
            galleryImages: inv.galleryImages,
          });
          if (!sectionPlan) {
            sectionPlan = createSectionPlanFromInvitation({
              groomName: inv.groomName,
              brideName: inv.brideName,
              weddingDate: inv.weddingDate,
              venueName: inv.venueName,
              venueAddress: inv.venueAddress,
              introMessage: inv.introMessage,
              galleryImages: inv.galleryImages,
              extendedData: (inv.extendedData as Record<string, unknown> | null) ?? null,
            });
          }
        }
      } catch {
        // 컨텍스트 추출 실패 시 null 폴백
      }
    }

    await db.insert(aiThemes).values({
      id: themeId,
      userId: user.id,
      invitationId: parsed.data.invitationId || null,
      prompt: parsed.data.prompt,
      modelId: themeModel.id,
      theme: null,
      status: 'completed',
      failReason: QUEUED_MARKER,
      creditsUsed: 1,
      inputTokens: null,
      outputTokens: null,
      cost: null,
      durationMs: null,
    });

    // 8. AI 테마 생성 실행 함수 (동기/백그라운드 공용)
    const temperature = parsed.data.mode === 'quality' ? 0.45 : 0.8;
    const runGeneration = async () => {
      const started = Date.now();
      await db.update(aiThemes)
        .set({ status: 'completed', failReason: PROCESSING_MARKER })
        .where(and(eq(aiThemes.id, themeId), eq(aiThemes.userId, user.id)));

      try {
        const result = await generateTheme(parsed.data.prompt, themeModel, {
          context: themeContext,
          sectionPlan,
          userIntent: (parsed.data.userIntent ?? null) as ThemeUserIntent | null,
          temperature,
        });

        const safelistResult = checkThemeClasses(result.theme as unknown as Record<string, unknown>);
        const themeStatus = safelistResult.valid ? 'completed' as const : 'safelist_failed' as const;

        await db.update(aiThemes).set({
          modelId: result.modelId,
          theme: result.theme,
          status: themeStatus,
          failReason: safelistResult.valid ? null : safelistResult.violations.slice(0, 20).join('\n'),
          creditsUsed: 1,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cost: result.cost,
          durationMs: Date.now() - started,
        }).where(and(eq(aiThemes.id, themeId), eq(aiThemes.userId, user.id)));

        return {
          theme: result.theme,
          modelId: result.modelId,
          status: themeStatus,
          failReason: safelistResult.valid ? undefined : '일부 스타일이 safelist에 포함되지 않아 적용 시 누락될 수 있습니다',
        };
      } catch (error) {
        await refundCredits(user.id, 1, {
          referenceType: 'THEME',
          referenceId: themeId,
          description: 'AI 테마 생성 실패 환불',
        });

        const failMessage = error instanceof Error ? error.message : String(error);
        await db.update(aiThemes).set({
          theme: null,
          status: 'failed',
          failReason: failMessage.slice(0, 2000),
          creditsUsed: 0,
          durationMs: Date.now() - started,
        }).where(and(eq(aiThemes.id, themeId), eq(aiThemes.userId, user.id)));

        throw error;
      }
    };

    // 10. 잔여 크레딧 (deductCredits 반환값 사용)
    const remainingCredits = isDev ? 999 : creditBalance;

    if (background) {
      after(async () => {
        try {
          await runGeneration();
        } catch (error) {
          console.error('[AI Theme] Background generation failed:', {
            userId: user.id,
            themeId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      return NextResponse.json({
        success: true,
        queued: true,
        themeId,
        modelId: themeModel.id,
        mode: parsed.data.mode || 'fast',
        status: 'queued',
        remainingCredits,
      });
    }

    const completed = await runGeneration();

    return NextResponse.json({
      success: true,
      queued: false,
      themeId,
      theme: completed.theme,
      modelId: completed.modelId,
      mode: parsed.data.mode || 'fast',
      status: completed.status,
      failReason: completed.failReason,
      remainingCredits,
    });

  } catch (error) {
    console.error('[AI Theme] Generation failed:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'AI 테마 생성 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

// ── GET: 테마 목록 ──

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const invitationId = request.nextUrl.searchParams.get('invitationId');

  const themes = await db
    .select({
      id: aiThemes.id,
      prompt: aiThemes.prompt,
      modelId: aiThemes.modelId,
      theme: aiThemes.theme,
      status: aiThemes.status,
      failReason: aiThemes.failReason,
      createdAt: aiThemes.createdAt,
    })
    .from(aiThemes)
    .where(
      invitationId
        ? and(eq(aiThemes.userId, user.id), eq(aiThemes.invitationId, invitationId))
        : eq(aiThemes.userId, user.id)
    )
    .orderBy(desc(aiThemes.createdAt))
    .limit(20);

  // safelist_failed 테마를 현재 safelist로 재검증 → 통과하면 status 업데이트
  const healed: string[] = [];
  for (const theme of themes) {
    if (theme.status === 'safelist_failed' && theme.theme) {
      const result = checkThemeClasses(theme.theme as Record<string, unknown>);
      if (result.valid) {
        healed.push(theme.id);
        theme.status = 'completed';
        theme.failReason = null;
      }
    }
  }
  if (healed.length > 0) {
    // 비동기로 DB 업데이트 (응답 지연 없이)
    db.update(aiThemes)
      .set({ status: 'completed', failReason: null })
      .where(and(eq(aiThemes.userId, user.id), eq(aiThemes.status, 'safelist_failed')))
      .then(() => {})
      .catch(() => {});
  }

  const themedWithRuntimeStatus = themes.map((theme) => {
    if (!theme.theme && theme.failReason === QUEUED_MARKER) {
      return { ...theme, status: 'queued' as const };
    }
    if (!theme.theme && theme.failReason === PROCESSING_MARKER) {
      return { ...theme, status: 'processing' as const };
    }
    return theme;
  });

  return NextResponse.json({ themes: themedWithRuntimeStatus });
}

// ── DELETE: 테마 삭제 ──

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '테마 ID가 필요합니다' }, { status: 400 });
  }

  const result = await db
    .delete(aiThemes)
    .where(and(eq(aiThemes.id, id), eq(aiThemes.userId, user.id)))
    .returning({ id: aiThemes.id });

  if (result.length === 0) {
    return NextResponse.json({ error: '테마를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
