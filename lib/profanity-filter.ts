/**
 * 로컬 비속어 필터 (한국어 + 영어)
 *
 * 클라이언트 + 서버 양쪽에서 사용 가능한 순수 함수.
 * 한글 자모 분해 정규화로 "씨발", "ㅆㅣㅂㅏㄹ", "씨 발" 모두 동일하게 감지.
 */

// ============================================================
// 한글 자모 분해
// ============================================================

const INITIAL_CONSONANTS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const MEDIAL_VOWELS = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];

const FINAL_CONSONANTS = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

/**
 * 한글 음절을 자모로 분해 (가 → ㄱㅏ, 힣 → ㅎㅣㅎ)
 * 이미 자모인 경우 그대로 반환
 */
function decomposeHangul(text: string): string {
  let result = '';
  for (const char of text) {
    const code = char.charCodeAt(0);

    // 완성형 음절 (가 ~ 힣)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const initialIndex = Math.floor(syllableIndex / (21 * 28));
      const medialIndex = Math.floor((syllableIndex % (21 * 28)) / 28);
      const finalIndex = syllableIndex % 28;

      result += INITIAL_CONSONANTS[initialIndex];
      result += MEDIAL_VOWELS[medialIndex];
      result += FINAL_CONSONANTS[finalIndex];
    }
    // 호환 자모 (ㄱ ~ ㅎ, ㅏ ~ ㅣ)
    else if ((code >= 0x3131 && code <= 0x3163)) {
      result += char;
    }
    // 영문/숫자 등은 소문자 변환 후 그대로
    else {
      result += char.toLowerCase();
    }
  }
  return result;
}

/**
 * 텍스트를 정규화: 공백/특수문자/제로폭 문자 제거 후 자모 분해
 */
function normalize(text: string): string {
  // 공백, 특수문자, 제로폭 문자(ZWJ, ZWNJ, ZWSP 등) 제거
  const cleaned = text.replace(/[\s\u200B-\u200D\uFEFF\u00A0.,!?@#$%^&*()_\-+=~`'"<>{}[\]|\\/:;]+/g, '');
  return decomposeHangul(cleaned);
}

// ============================================================
// 비속어 목록 (자모 분해된 형태)
// ============================================================

// 한국어 욕설 (자모 분해 형태로 저장)
const KOREAN_PROFANITY_RAW = [
  '씨발', '시발', '씨팔', '시팔', '씹', '좆', '지랄', '병신',
  '개새끼', '새끼', '미친놈', '미친년', '꺼져', '닥쳐', '엿먹어',
  '개같은', '또라이', '찐따', '한남', '한녀', '느금마', '니미',
  '보지', '자지', '염병', '좃', '등신',
];

// 영어 욕설
const ENGLISH_PROFANITY = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
  'cunt', 'damn', 'nigger', 'nigga', 'whore', 'slut', 'retard',
  'faggot', 'motherfucker',
];

// 자모 분해된 한국어 욕설 패턴
const PROFANITY_PATTERNS: string[] = [
  ...KOREAN_PROFANITY_RAW.map(decomposeHangul),
  ...ENGLISH_PROFANITY,
];

// 축약형/초성 패턴 (자모 그대로 매칭)
const ABBREVIATION_PATTERNS = [
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅈㄹ', 'ㅗ', 'ㅅㅂㄴ', 'ㅆㅂㄴ',
  'ㄲㅈ', 'ㄷㅊ',
];

// ============================================================
// Public API
// ============================================================

/**
 * 텍스트에 비속어가 포함되어 있는지 검사 (클라이언트+서버 공용)
 */
export function checkProfanityLocal(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  const normalized = normalize(text);

  // 자모 분해된 패턴 매칭
  for (const pattern of PROFANITY_PATTERNS) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }

  // 축약형 패턴 매칭 (원문에서 공백/특수문자만 제거)
  const cleanedOriginal = text.replace(/[\s\u200B-\u200D\uFEFF\u00A0]+/g, '');
  for (const abbr of ABBREVIATION_PATTERNS) {
    if (cleanedOriginal.includes(abbr)) {
      return true;
    }
  }

  return false;
}

/**
 * Zod refine용 래퍼 — 비속어가 없으면 true 반환
 */
export function noProfanity(text: string): boolean {
  return !checkProfanityLocal(text);
}
