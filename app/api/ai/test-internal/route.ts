import { NextRequest, NextResponse } from 'next/server';
import {
  generateWithInternalModel,
  checkInternalServerHealth,
} from '@/lib/ai/internal';
import { uploadToS3 } from '@/lib/ai/s3';

/**
 * 사내 AI 모듈 테스트 API
 *
 * POST /api/ai/test-internal
 *
 * 개발 환경 전용. 운영에서는 403 반환.
 *
 * Request: FormData
 * - image: File (필수) - 얼굴 참조 이미지
 * - prompt: string (선택) - 생성 프롬프트
 * - width: number (선택, 기본 768)
 * - height: number (선택, 기본 1024)
 * - numInferenceSteps: number (선택, 기본 8)
 * - guidanceScale: number (선택, 기본 1.2)
 * - pulidWeight: number (선택, 기본 1.0)
 * - seed: number (선택)
 *
 * Response: JSON
 * { url: string, seed: number }
 */
export async function POST(request: NextRequest) {
  // 개발 환경 체크
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();

    // 이미지 추출
    const imageFile = formData.get('image') as File | null;
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // 파라미터 추출
    const prompt =
      (formData.get('prompt') as string) ||
      'handsome Korean man in elegant black tuxedo, professional wedding portrait, studio lighting';

    const width = parseInt((formData.get('width') as string) || '768', 10);
    const height = parseInt((formData.get('height') as string) || '1024', 10);
    const numInferenceSteps = parseInt(
      (formData.get('numInferenceSteps') as string) || '8',
      10
    );
    const guidanceScale = parseFloat(
      (formData.get('guidanceScale') as string) || '1.2'
    );
    const pulidWeight = formData.get('pulidWeight')
      ? parseFloat(formData.get('pulidWeight') as string)
      : undefined;
    const seed = formData.get('seed')
      ? parseInt(formData.get('seed') as string, 10)
      : undefined;

    // 서버 상태 체크 (선택적)
    const isHealthy = await checkInternalServerHealth();
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'Internal AI server is not available' },
        { status: 503 }
      );
    }

    // 사내 모듈 호출
    const result = await generateWithInternalModel({
      prompt,
      width,
      height,
      numInferenceSteps,
      guidanceScale,
      pulidWeight,
      seed,
      images: [imageBuffer],
    });

    // S3 업로드
    const { url } = await uploadToS3(
      result.imageBuffer,
      'image/png',
      'ai-test-internal'
    );

    return NextResponse.json({
      url,
      seed: result.seed,
    });
  } catch (error) {
    console.error('[test-internal] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 서버 상태 확인
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  const isHealthy = await checkInternalServerHealth();

  return NextResponse.json({
    status: isHealthy ? 'ok' : 'unavailable',
    serverUrl: process.env.INTERNAL_AI_URL || 'http://192.168.0.208:19010',
  });
}
