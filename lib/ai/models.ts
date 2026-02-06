/**
 * AI 모델 정의 및 설정
 */

import type { ProviderType } from './providers/types';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerType: ProviderType;
  costPerImage: number;
  description: string;
  facePreservation: 'excellent' | 'good' | 'fair' | 'poor';
  speed: 'fast' | 'medium' | 'slow';
  providerModel: string;
  supportsMultipleOutputs: boolean;
  supportsReferenceImage: boolean;
}

export const AI_MODELS: Record<string, AIModel> = {
  // ✅ 검증됨 - Replicate 공식 모델
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux 1.1 Pro',
    provider: 'Black Forest Labs',
    providerType: 'replicate',
    costPerImage: 0.04,
    description: '최신 고품질, 얼굴 보존 약함',
    facePreservation: 'fair',
    speed: 'fast',
    providerModel: 'black-forest-labs/flux-1.1-pro',
    supportsMultipleOutputs: false,
    supportsReferenceImage: true,
  },
  FLUX_DEV: {
    id: 'flux-dev',
    name: 'Flux Dev',
    provider: 'Black Forest Labs',
    providerType: 'replicate',
    costPerImage: 0.025,
    description: 'Flux 개발 버전, 저렴',
    facePreservation: 'fair',
    speed: 'fast',
    providerModel: 'black-forest-labs/flux-dev',
    supportsMultipleOutputs: false,
    supportsReferenceImage: true,
  },

  // ✅ 검증됨 - 얼굴 보존 우수
  PHOTOMAKER: {
    id: 'photomaker',
    name: 'PhotoMaker',
    provider: 'Tencent ARC',
    providerType: 'replicate',
    costPerImage: 0.0095,
    description: '얼굴 보존 우수, 인기 모델',
    facePreservation: 'excellent',
    speed: 'medium',
    providerModel: 'tencentarc/photomaker',
    supportsMultipleOutputs: false,
    supportsReferenceImage: true,
  },

  // 🆕 OpenAI
  GPT_IMAGE: {
    id: 'gpt-image-1',
    name: 'GPT Image 1',
    provider: 'OpenAI',
    providerType: 'openai',
    costPerImage: 0.04,
    description: '이미지 편집, 얼굴 보존 우수',
    facePreservation: 'good',
    speed: 'medium',
    providerModel: 'gpt-image-1',
    supportsMultipleOutputs: false,
    supportsReferenceImage: true,
  },
  DALLE_3: {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    providerType: 'openai',
    costPerImage: 0.04,
    description: '텍스트 기반 생성, 참조 이미지 불가',
    facePreservation: 'poor',
    speed: 'fast',
    providerModel: 'dall-e-3',
    supportsMultipleOutputs: false,
    supportsReferenceImage: false,
  },

  // 🆕 Google (Gemini 네이티브 이미지 생성)
  GEMINI_FLASH_IMAGE: {
    id: 'gemini-flash-image',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerType: 'gemini',
    costPerImage: 0.02,
    description: '빠르고 저렴한 이미지 생성',
    facePreservation: 'good',
    speed: 'fast',
    providerModel: 'gemini-2.5-flash-image',
    supportsMultipleOutputs: false,
    supportsReferenceImage: true,
  },

  // 🧪 테스트 필요 - 404 발생 가능
  // SDXL_FACEID: {
  //   id: 'sdxl-faceid',
  //   name: 'SDXL + IP-Adapter FaceID',
  //   provider: 'lucataco',
  //   providerType: 'replicate',
  //   costPerImage: 0.005,
  //   description: '얼굴 ID 보존, 가장 저렴',
  //   facePreservation: 'excellent',
  //   speed: 'medium',
  //   providerModel: 'lucataco/ip-adapter-faceid',
  //   supportsMultipleOutputs: false,
  //   supportsReferenceImage: true,
  // },
  // INSTANT_ID: {
  //   id: 'instant-id',
  //   name: 'InstantID',
  //   provider: 'zsxkib',
  //   providerType: 'replicate',
  //   costPerImage: 0.0095,
  //   description: '즉각적인 얼굴 ID 전환',
  //   facePreservation: 'excellent',
  //   speed: 'fast',
  //   providerModel: 'zsxkib/instant-id',
  //   supportsMultipleOutputs: false,
  //   supportsReferenceImage: true,
  // },
};

export const DEFAULT_MODEL = 'flux-pro'; // 모델 ID (소문자)

/**
 * 모델 ID로 AIModel 찾기
 */
export function findModelById(modelId: string): AIModel | undefined {
  return Object.values(AI_MODELS).find((m) => m.id === modelId);
}

/**
 * 모델별 총 비용 계산
 */
export function calculateTotalCost(modelId: string, batchSize: number): number {
  const model = findModelById(modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return model.costPerImage * batchSize;
}

/**
 * 개발 모드 체크
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}
