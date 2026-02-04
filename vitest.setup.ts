// Vitest 글로벌 설정
import { expect } from 'vitest';

// 환경 변수 설정 (테스트용)
// NODE_ENV는 Vitest가 자동으로 'test'로 설정함
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://localhost/cuggu_test';
}
