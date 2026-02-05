import { describe, it, expect } from 'vitest';
import { formatFamilyName, getBothDeceasedGuidance } from '../family-display';
import type { FamilyNameInput } from '../family-display';

describe('formatFamilyName', () => {
  it('양부모 정상 - full_names 기본', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨',
      relation: '장남',
    };
    expect(formatFamilyName(input)).toBe('홍판서·김씨의 장남');
  });

  it('양부모 정상 - displayMode 명시', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨',
      relation: '장남',
      displayMode: 'full_names',
    };
    expect(formatFamilyName(input)).toBe('홍판서·김씨의 장남');
  });

  it('아버지만 故', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨',
      relation: '장남',
      isDeceased: { father: true },
    };
    expect(formatFamilyName(input)).toBe('故 홍판서·김씨의 장남');
  });

  it('어머니만 故', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨',
      relation: '차녀',
      isDeceased: { mother: true },
    };
    expect(formatFamilyName(input)).toBe('홍판서·故 김씨의 차녀');
  });

  it('양부모 모두 故 - 장남 → 자', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨',
      relation: '장남',
      isDeceased: { father: true, mother: true },
    };
    expect(formatFamilyName(input)).toBe('故 홍판서·故 김씨의 자');
  });

  it('양부모 모두 故 - 장녀 → 녀', () => {
    const input: FamilyNameInput = {
      fatherName: '이성호',
      motherName: '최미영',
      relation: '장녀',
      isDeceased: { father: true, mother: true },
    };
    expect(formatFamilyName(input)).toBe('故 이성호·故 최미영의 녀');
  });

  it('한부모 아버지', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨', // 있어도 무시됨
      relation: '장남',
      displayMode: 'single_parent_father',
    };
    expect(formatFamilyName(input)).toBe('홍판서의 장남');
  });

  it('한부모 아버지 + 故', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      relation: '차남',
      displayMode: 'single_parent_father',
      isDeceased: { father: true },
    };
    expect(formatFamilyName(input)).toBe('故 홍판서의 차남');
  });

  it('한부모 어머니', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서', // 있어도 무시됨
      motherName: '김씨',
      relation: '장녀',
      displayMode: 'single_parent_mother',
    };
    expect(formatFamilyName(input)).toBe('김씨의 장녀');
  });

  it('한부모 어머니 + 故', () => {
    const input: FamilyNameInput = {
      motherName: '김씨',
      relation: '막내',
      displayMode: 'single_parent_mother',
      isDeceased: { mother: true },
    };
    expect(formatFamilyName(input)).toBe('故 김씨의 막내');
  });

  it('relation 없음 → 빈 문자열', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨',
    };
    expect(formatFamilyName(input)).toBe('');
  });

  it('displayMode 없음 → full_names 기본값', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      motherName: '김씨',
      relation: '장남',
      // displayMode 미설정
    };
    expect(formatFamilyName(input)).toBe('홍판서·김씨의 장남');
  });

  it('아버지 이름 없고 어머니만 있는 full_names', () => {
    const input: FamilyNameInput = {
      motherName: '김씨',
      relation: '장남',
    };
    expect(formatFamilyName(input)).toBe('김씨의 장남');
  });

  it('어머니 이름 없고 아버지만 있는 full_names', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      relation: '장녀',
    };
    expect(formatFamilyName(input)).toBe('홍판서의 장녀');
  });

  it('부모 이름 모두 없음 → 빈 문자열', () => {
    const input: FamilyNameInput = {
      relation: '장남',
    };
    expect(formatFamilyName(input)).toBe('');
  });

  it('한부모 아버지인데 아버지 이름 없음 → 빈 문자열', () => {
    const input: FamilyNameInput = {
      motherName: '김씨',
      relation: '장남',
      displayMode: 'single_parent_father',
    };
    expect(formatFamilyName(input)).toBe('');
  });

  it('한부모 어머니인데 어머니 이름 없음 → 빈 문자열', () => {
    const input: FamilyNameInput = {
      fatherName: '홍판서',
      relation: '장녀',
      displayMode: 'single_parent_mother',
    };
    expect(formatFamilyName(input)).toBe('');
  });

  it('공백만 있는 이름은 빈 문자열 취급', () => {
    const input: FamilyNameInput = {
      fatherName: '  ',
      motherName: '  ',
      relation: '장남',
    };
    expect(formatFamilyName(input)).toBe('');
  });
});

describe('getBothDeceasedGuidance', () => {
  it('양부모 모두 故 → 안내 메시지 반환', () => {
    const result = getBothDeceasedGuidance({ father: true, mother: true });
    expect(result).toBeTruthy();
    expect(result).toContain('고인');
  });

  it('아버지만 故 → null', () => {
    expect(getBothDeceasedGuidance({ father: true })).toBeNull();
  });

  it('어머니만 故 → null', () => {
    expect(getBothDeceasedGuidance({ mother: true })).toBeNull();
  });

  it('둘 다 아님 → null', () => {
    expect(getBothDeceasedGuidance({ father: false, mother: false })).toBeNull();
  });

  it('undefined → null', () => {
    expect(getBothDeceasedGuidance(undefined)).toBeNull();
  });
});
