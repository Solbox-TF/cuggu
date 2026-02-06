/**
 * 프로바이더 무관 AI 이미지 생성 오케스트레이터
 * API route에서 이 파일을 import해서 사용
 */

import { getProvider } from './providers';
import { AI_MODELS, DEFAULT_MODEL, findModelById } from './models';
import { buildPrompt, type AIStyle } from './prompts';
import { AI_CONFIG } from './constants';
import { uploadToS3 } from './s3';

export type { AIStyle } from './prompts';

export interface GenerationResult {
  urls: string[];
  providerJobId: string;
  cost: number;
}

/**
 * 웨딩 사진 4장 생성 (동기)
 */
export async function generateWeddingPhotos(
  imageUrl: string,
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  modelId?: string,
): Promise<GenerationResult> {
  const selectedModelId = modelId || DEFAULT_MODEL;
  const model = findModelById(selectedModelId);

  if (!model) {
    throw new Error(`Unknown model: ${selectedModelId}`);
  }

  const provider = getProvider(model.providerType);
  const prompt = buildPrompt(style, role);

  const urls: string[] = [];
  const jobIds: string[] = [];

  for (let i = 0; i < AI_CONFIG.BATCH_SIZE; i++) {
    const result = await provider.generateImage({
      prompt,
      imageUrl,
      modelConfig: model,
      variationIndex: i,
    });

    jobIds.push(result.providerJobId);

    if (result.type === 'base64') {
      // base64 → S3 업로드
      const buffer = Buffer.from(result.data, 'base64');
      const s3Result = await uploadToS3(buffer, result.mimeType || 'image/png', 'ai-generated');
      urls.push(s3Result.url);
    } else {
      // URL 타입 (Replicate) - 그대로 전달, API route에서 copyToS3
      urls.push(result.data);
    }
  }

  const cost = AI_CONFIG.BATCH_SIZE * model.costPerImage;

  return {
    urls,
    providerJobId: jobIds[0],
    cost,
  };
}

/**
 * 스트리밍 방식 웨딩 사진 생성 (1장씩 콜백)
 */
export async function generateWeddingPhotosStream(
  imageUrl: string,
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  onImageGenerated: (index: number, url: string) => void,
  modelId?: string,
): Promise<GenerationResult> {
  const selectedModelId = modelId || DEFAULT_MODEL;
  const model = findModelById(selectedModelId);

  if (!model) {
    throw new Error(`Unknown model: ${selectedModelId}`);
  }

  const provider = getProvider(model.providerType);
  const prompt = buildPrompt(style, role);

  const urls: string[] = [];
  const jobIds: string[] = [];

  for (let i = 0; i < AI_CONFIG.BATCH_SIZE; i++) {
    const result = await provider.generateImage({
      prompt,
      imageUrl,
      modelConfig: model,
      variationIndex: i,
    });

    jobIds.push(result.providerJobId);

    let finalUrl: string;
    if (result.type === 'base64') {
      const buffer = Buffer.from(result.data, 'base64');
      const s3Result = await uploadToS3(buffer, result.mimeType || 'image/png', 'ai-generated');
      finalUrl = s3Result.url;
    } else {
      finalUrl = result.data;
    }

    urls.push(finalUrl);
    onImageGenerated(i, finalUrl);
  }

  const cost = AI_CONFIG.BATCH_SIZE * model.costPerImage;

  return {
    urls,
    providerJobId: jobIds[0],
    cost,
  };
}

/**
 * 모델이 참조 이미지를 지원하는지 확인
 */
export function modelSupportsReferenceImage(modelId?: string): boolean {
  const model = findModelById(modelId || DEFAULT_MODEL);
  return model?.supportsReferenceImage ?? true;
}
