import { rateLimit as genericRateLimit } from '@/lib/rate-limit';
import { AI_CONFIG } from './constants';

/**
 * AI 생성 전용 rate limiter
 * 범용 rate-limit 모듈을 AI 설정으로 래핑
 */
export async function rateLimit(userId: string): Promise<boolean> {
  const result = await genericRateLimit(
    `ratelimit:ai:${userId}`,
    AI_CONFIG.RATE_LIMIT_REQUESTS,
    AI_CONFIG.RATE_LIMIT_WINDOW
  );
  return result.allowed;
}
