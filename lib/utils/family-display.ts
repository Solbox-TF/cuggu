import type { FamilyDisplayMode } from '@/schemas/invitation';

/**
 * formatFamilyName()에 필요한 입력 타입
 * Person 스키마의 부분 집합
 */
export interface FamilyNameInput {
  fatherName?: string;
  motherName?: string;
  relation?: string;
  displayMode?: FamilyDisplayMode;
  isDeceased?: {
    father?: boolean;
    mother?: boolean;
  };
}

/**
 * 가족 표기 문자열 생성
 *
 * 렌더링 규칙:
 * - full_names (기본): "홍판서·김씨의 장남"
 * - full_names + 故 아버지: "故 홍판서·김씨의 장남"
 * - full_names + 故 양부모: "故 홍판서·故 김씨의 자"
 * - single_parent_father: "홍판서의 장남"
 * - single_parent_mother: "김씨의 장남"
 * - relation 없음 → 빈 문자열 (템플릿에서 "신랑"/"신부" 폴백)
 */
export function formatFamilyName(person: FamilyNameInput): string {
  const { relation, displayMode = 'full_names', isDeceased } = person;

  if (!relation) return '';

  const mode = displayMode || 'full_names';

  if (mode === 'single_parent_father') {
    const fatherName = person.fatherName?.trim();
    if (!fatherName) return '';
    const prefix = isDeceased?.father ? '故 ' : '';
    return `${prefix}${fatherName}의 ${relation}`;
  }

  if (mode === 'single_parent_mother') {
    const motherName = person.motherName?.trim();
    if (!motherName) return '';
    const prefix = isDeceased?.mother ? '故 ' : '';
    return `${prefix}${motherName}의 ${relation}`;
  }

  // full_names (기본)
  const fatherName = person.fatherName?.trim();
  const motherName = person.motherName?.trim();

  if (!fatherName && !motherName) return '';

  const fatherDeceased = isDeceased?.father;
  const motherDeceased = isDeceased?.mother;

  // 양부모 모두 故일 때 relation을 "자"/"녀"로 변경
  const displayRelation = (fatherDeceased && motherDeceased)
    ? normalizeRelationForDeceased(relation)
    : relation;

  const parts: string[] = [];

  if (fatherName) {
    parts.push(fatherDeceased ? `故 ${fatherName}` : fatherName);
  }
  if (motherName) {
    parts.push(motherDeceased ? `故 ${motherName}` : motherName);
  }

  if (parts.length === 0) return '';

  return `${parts.join('·')}의 ${displayRelation}`;
}

/**
 * 양부모 모두 故일 때, "장남" → "자", "장녀" → "녀" 등으로 변환
 * 한국 전통 예법: 돌아가신 부모를 강조하지 않고 간결하게 표기
 */
function normalizeRelationForDeceased(relation: string): string {
  if (['장남', '차남', '삼남', '막내아들'].includes(relation)) return '자';
  if (['장녀', '차녀', '삼녀', '막내딸'].includes(relation)) return '녀';
  if (relation === '막내') return '자'; // 성별 불명확 시 "자"
  return relation;
}

/**
 * 양부모 모두 故일 때 안내 메시지 반환
 * UI에서 사용자에게 표시
 */
export function getBothDeceasedGuidance(
  isDeceased?: { father?: boolean; mother?: boolean }
): string | null {
  if (!isDeceased?.father || !isDeceased?.mother) return null;
  return '양가 부모님 모두 고인이신 경우, 관계가 "자" 또는 "녀"로 간결하게 표기됩니다.';
}
