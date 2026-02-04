/**
 * AI 모델 정의 및 설정
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  costPerImage: number;
  description: string;
  facePreservation: 'excellent' | 'good' | 'fair' | 'poor';
  speed: 'fast' | 'medium' | 'slow';
  replicateModel: string;
  supportsMultipleOutputs: boolean;
}

export const AI_MODELS: Record<string, AIModel> = {
  // ✅ 검증됨 - 공식 모델
  FLUX_PRO: {
    id: 'flux-pro',
    name: 'Flux 1.1 Pro',
    provider: 'Black Forest Labs',
    costPerImage: 0.04,
    description: '최신 고품질, 얼굴 보존 약함',
    facePreservation: 'fair',
    speed: 'fast',
    replicateModel: 'black-forest-labs/flux-1.1-pro',
    supportsMultipleOutputs: false,
  },
  FLUX_DEV: {
    id: 'flux-dev',
    name: 'Flux Dev',
    provider: 'Black Forest Labs',
    costPerImage: 0.025,
    description: 'Flux 개발 버전, 저렴',
    facePreservation: 'fair',
    speed: 'fast',
    replicateModel: 'black-forest-labs/flux-dev',
    supportsMultipleOutputs: false,
  },

  // ✅ 검증됨 - 얼굴 보존 우수
  PHOTOMAKER: {
    id: 'photomaker',
    name: 'PhotoMaker',
    provider: 'Tencent ARC',
    costPerImage: 0.0095,
    description: '얼굴 보존 우수, 인기 모델',
    facePreservation: 'excellent',
    speed: 'medium',
    replicateModel: 'tencentarc/photomaker',
    supportsMultipleOutputs: false,
  },

  // 🧪 테스트 필요 - 404 발생 가능
  // SDXL_FACEID: {
  //   id: 'sdxl-faceid',
  //   name: 'SDXL + IP-Adapter FaceID',
  //   provider: 'lucataco',
  //   costPerImage: 0.005,
  //   description: '얼굴 ID 보존, 가장 저렴',
  //   facePreservation: 'excellent',
  //   speed: 'medium',
  //   replicateModel: 'lucataco/ip-adapter-faceid',
  //   supportsMultipleOutputs: false,
  // },
  // INSTANT_ID: {
  //   id: 'instant-id',
  //   name: 'InstantID',
  //   provider: 'zsxkib',
  //   costPerImage: 0.0095,
  //   description: '즉각적인 얼굴 ID 전환',
  //   facePreservation: 'excellent',
  //   speed: 'fast',
  //   replicateModel: 'zsxkib/instant-id',
  //   supportsMultipleOutputs: false,
  // },
};

export const DEFAULT_MODEL = 'flux-pro'; // 모델 ID (소문자)

/**
 * 모델별 총 비용 계산
 */
export function calculateTotalCost(modelId: string, batchSize: number): number {
  const model = AI_MODELS[modelId];
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
