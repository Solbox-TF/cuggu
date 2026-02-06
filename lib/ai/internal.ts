/**
 * 사내 PuLID 기반 얼굴 생성 모듈 클라이언트
 *
 * 외부 Replicate API 대신 사내 GPU 서버 직접 호출.
 * 테스트/개발 용도.
 */

const INTERNAL_API_URL =
  process.env.INTERNAL_AI_URL || 'http://192.168.0.208:19010';

const DEFAULT_TIMEOUT = 120_000; // 2분

export interface InternalGenerateParams {
  prompt: string;
  width: number;
  height: number;
  numInferenceSteps: number;
  guidanceScale: number;
  pulidWeight?: number;
  pulidStartAt?: number;
  seed?: number;
  images?: Buffer[];
}

export interface InternalGenerateResult {
  imageBuffer: Buffer;
  seed: number;
}

/**
 * 사내 AI 서버로 얼굴 이미지 생성
 *
 * @param params - 생성 파라미터
 * @returns 생성된 이미지 버퍼와 시드값
 * @throws 네트워크 오류, 타임아웃, 서버 에러
 */
export async function generateWithInternalModel(
  params: InternalGenerateParams
): Promise<InternalGenerateResult> {
  const formData = new FormData();

  // 필수 파라미터
  formData.append('prompt', params.prompt);
  formData.append('width', params.width.toString());
  formData.append('height', params.height.toString());
  formData.append('num_inference_steps', params.numInferenceSteps.toString());
  formData.append('guidance_scale', params.guidanceScale.toString());

  // 선택 파라미터
  if (params.pulidWeight !== undefined) {
    formData.append('pulid_weight', params.pulidWeight.toString());
  }
  if (params.pulidStartAt !== undefined) {
    formData.append('pulid_start_at', params.pulidStartAt.toString());
  }
  if (params.seed !== undefined) {
    formData.append('seed', params.seed.toString());
  }

  // 참조 이미지들
  if (params.images && params.images.length > 0) {
    for (const imageBuffer of params.images) {
      // Buffer를 Uint8Array로 변환 (Blob 호환)
      const uint8Array = new Uint8Array(imageBuffer);
      const blob = new Blob([uint8Array], { type: 'image/png' });
      formData.append('images', blob, 'image.png');
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${INTERNAL_API_URL}/generate-face`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Internal AI server error: ${response.status} - ${errorText}`
      );
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const seedHeader = response.headers.get('X-Seed');
    const seed = seedHeader ? parseInt(seedHeader, 10) : 0;

    return { imageBuffer, seed };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Internal AI server timeout after ${DEFAULT_TIMEOUT / 1000}s`
      );
    }

    throw error;
  }
}

/**
 * 사내 AI 서버 연결 상태 체크
 */
export async function checkInternalServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${INTERNAL_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
