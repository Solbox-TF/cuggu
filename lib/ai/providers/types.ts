/**
 * AI 프로바이더 공통 인터페이스
 */

import type { AIModel } from '../models';

export type ProviderType = 'replicate' | 'openai' | 'gemini';

export interface ImageOutput {
  /** 'url': 외부 CDN URL (Replicate), 'base64': base64 인코딩 이미지 (OpenAI, Gemini) */
  type: 'url' | 'base64';
  data: string;
  mimeType?: string;
  providerJobId: string;
}

export interface GenerationProvider {
  readonly providerType: ProviderType;

  generateImage(params: {
    prompt: string;
    imageUrl: string;
    modelConfig: AIModel;
    variationIndex: number;
  }): Promise<ImageOutput>;
}
