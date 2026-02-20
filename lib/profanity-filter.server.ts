/**
 * OpenAI Moderation API 래퍼 (서버 전용)
 *
 * 다국어 비속어 감지. 무료 API, 응답 100~300ms.
 * 기존 openai 패키지(v6.18) + OPENAI_API_KEY 재사용.
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for profanity check');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

interface ProfanityAIResult {
  hasProfanity: boolean;
  categories?: string[];
}

/**
 * OpenAI Moderation API로 텍스트 검사 (서버에서만 호출)
 *
 * AI API 실패 시 hasProfanity: false 반환 (graceful degradation)
 */
export async function checkProfanityAI(text: string): Promise<ProfanityAIResult> {
  try {
    const openai = getOpenAI();
    const response = await openai.moderations.create({
      input: text,
    });

    const result = response.results[0];
    if (!result) {
      return { hasProfanity: false };
    }

    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([, flagged]) => flagged)
        .map(([category]) => category);

      return {
        hasProfanity: true,
        categories: flaggedCategories,
      };
    }

    return { hasProfanity: false };
  } catch (error) {
    // AI API 실패 시 로컬 결과만으로 진행 (graceful degradation)
    console.error('OpenAI Moderation API 호출 실패:', error);
    return { hasProfanity: false };
  }
}
