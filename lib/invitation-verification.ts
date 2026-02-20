import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '';

/** 쿠키 유효기간 24시간 (초) */
export const VERIFICATION_COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * 청첩장 비밀번호 검증 후 HMAC 서명된 토큰 생성
 * 쿠키 위조 방지 — 단순 'true' 대신 서명된 값 사용
 */
export function createVerificationToken(invitationId: string): string {
  const payload = `${invitationId}:verified`;
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return hmac;
}

/**
 * 쿠키의 HMAC 토큰이 유효한지 검증
 */
export function verifyVerificationToken(invitationId: string, token: string): boolean {
  const expected = createVerificationToken(invitationId);
  // timing-safe comparison으로 타이밍 공격 방어
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
