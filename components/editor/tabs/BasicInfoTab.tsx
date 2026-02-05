'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { getBothDeceasedGuidance } from '@/lib/utils/family-display';
import type { FamilyDisplayMode } from '@/schemas/invitation';

const DISPLAY_MODE_OPTIONS: { value: FamilyDisplayMode; label: string }[] = [
  { value: 'full_names', label: '부모님 모두 표기' },
  { value: 'single_parent_father', label: '한 분만 표기 - 아버지' },
  { value: 'single_parent_mother', label: '한 분만 표기 - 어머니' },
];

const GROOM_RELATIONS = [
  { value: '', label: '선택' },
  { value: '장남', label: '장남' },
  { value: '차남', label: '차남' },
  { value: '삼남', label: '삼남' },
  { value: '막내', label: '막내' },
];

const BRIDE_RELATIONS = [
  { value: '', label: '선택' },
  { value: '장녀', label: '장녀' },
  { value: '차녀', label: '차녀' },
  { value: '삼녀', label: '삼녀' },
  { value: '막내', label: '막내' },
];

const INPUT_CLASS =
  'w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400';

/**
 * 기본 정보 탭
 *
 * 신랑/신부 정보 입력
 * - 이름 (필수)
 * - 가족 표기 모드 (양부모/한부모)
 * - 부모님 이름 + 故 체크박스
 * - 관계 (장남/차남 등)
 * - 연락처
 */
export function BasicInfoTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleGroomChange = (field: string, value: any) => {
    updateInvitation({
      groom: {
        ...invitation.groom,
        [field]: value,
      },
    });
  };

  const handleBrideChange = (field: string, value: any) => {
    updateInvitation({
      bride: {
        ...invitation.bride,
        [field]: value,
      },
    });
  };

  const handleDeceasedChange = (side: 'groom' | 'bride', parent: 'father' | 'mother', value: boolean) => {
    const handler = side === 'groom' ? handleGroomChange : handleBrideChange;
    const current = side === 'groom' ? invitation.groom : invitation.bride;
    handler('isDeceased', { ...current?.isDeceased, [parent]: value });
  };

  const groomMode: FamilyDisplayMode = invitation.groom?.displayMode || 'full_names';
  const brideMode: FamilyDisplayMode = invitation.bride?.displayMode || 'full_names';

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">기본 정보</h2>
        <p className="text-sm text-stone-500">신랑과 신부의 정보를 입력하세요</p>
      </div>

      {/* 신랑 정보 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">신랑</h3>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invitation.groom?.name || ''}
            onChange={(e) => handleGroomChange('name', e.target.value)}
            placeholder="홍길동"
            className={INPUT_CLASS}
          />
        </div>

        {/* 가족 표기 모드 */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            가족 표기
          </label>
          <div className="space-y-1.5">
            {DISPLAY_MODE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="groom-display-mode"
                  value={option.value}
                  checked={groomMode === option.value}
                  onChange={() => handleGroomChange('displayMode', option.value)}
                  className="accent-pink-400"
                />
                <span className="text-sm text-stone-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 부모님 이름 - 조건부 */}
        {(groomMode === 'full_names' || groomMode === 'single_parent_father') && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-stone-600">아버지</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invitation.groom?.isDeceased?.father || false}
                  onChange={(e) => handleDeceasedChange('groom', 'father', e.target.checked)}
                  className="w-3.5 h-3.5 accent-stone-500 rounded"
                />
                <span className="text-xs text-stone-500">고인</span>
              </label>
            </div>
            <input
              type="text"
              value={invitation.groom?.fatherName || ''}
              onChange={(e) => handleGroomChange('fatherName', e.target.value)}
              placeholder="홍판서"
              className={INPUT_CLASS}
            />
          </div>
        )}

        {(groomMode === 'full_names' || groomMode === 'single_parent_mother') && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-stone-600">어머니</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invitation.groom?.isDeceased?.mother || false}
                  onChange={(e) => handleDeceasedChange('groom', 'mother', e.target.checked)}
                  className="w-3.5 h-3.5 accent-stone-500 rounded"
                />
                <span className="text-xs text-stone-500">고인</span>
              </label>
            </div>
            <input
              type="text"
              value={invitation.groom?.motherName || ''}
              onChange={(e) => handleGroomChange('motherName', e.target.value)}
              placeholder="김씨"
              className={INPUT_CLASS}
            />
          </div>
        )}

        {/* 양부모 모두 故일 때 안내 */}
        {getBothDeceasedGuidance(invitation.groom?.isDeceased) && (
          <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            {getBothDeceasedGuidance(invitation.groom?.isDeceased)}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              관계
            </label>
            <select
              value={invitation.groom?.relation || ''}
              onChange={(e) => handleGroomChange('relation', e.target.value)}
              className={INPUT_CLASS}
            >
              {GROOM_RELATIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              연락처
            </label>
            <input
              type="tel"
              value={invitation.groom?.phone || ''}
              onChange={(e) => handleGroomChange('phone', e.target.value)}
              placeholder="010-1234-5678"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {/* 신부 정보 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">신부</h3>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invitation.bride?.name || ''}
            onChange={(e) => handleBrideChange('name', e.target.value)}
            placeholder="김영희"
            className={INPUT_CLASS}
          />
        </div>

        {/* 가족 표기 모드 */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            가족 표기
          </label>
          <div className="space-y-1.5">
            {DISPLAY_MODE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bride-display-mode"
                  value={option.value}
                  checked={brideMode === option.value}
                  onChange={() => handleBrideChange('displayMode', option.value)}
                  className="accent-pink-400"
                />
                <span className="text-sm text-stone-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 부모님 이름 - 조건부 */}
        {(brideMode === 'full_names' || brideMode === 'single_parent_father') && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-stone-600">아버지</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invitation.bride?.isDeceased?.father || false}
                  onChange={(e) => handleDeceasedChange('bride', 'father', e.target.checked)}
                  className="w-3.5 h-3.5 accent-stone-500 rounded"
                />
                <span className="text-xs text-stone-500">고인</span>
              </label>
            </div>
            <input
              type="text"
              value={invitation.bride?.fatherName || ''}
              onChange={(e) => handleBrideChange('fatherName', e.target.value)}
              placeholder="김판서"
              className={INPUT_CLASS}
            />
          </div>
        )}

        {(brideMode === 'full_names' || brideMode === 'single_parent_mother') && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-stone-600">어머니</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invitation.bride?.isDeceased?.mother || false}
                  onChange={(e) => handleDeceasedChange('bride', 'mother', e.target.checked)}
                  className="w-3.5 h-3.5 accent-stone-500 rounded"
                />
                <span className="text-xs text-stone-500">고인</span>
              </label>
            </div>
            <input
              type="text"
              value={invitation.bride?.motherName || ''}
              onChange={(e) => handleBrideChange('motherName', e.target.value)}
              placeholder="이씨"
              className={INPUT_CLASS}
            />
          </div>
        )}

        {/* 양부모 모두 故일 때 안내 */}
        {getBothDeceasedGuidance(invitation.bride?.isDeceased) && (
          <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            {getBothDeceasedGuidance(invitation.bride?.isDeceased)}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              관계
            </label>
            <select
              value={invitation.bride?.relation || ''}
              onChange={(e) => handleBrideChange('relation', e.target.value)}
              className={INPUT_CLASS}
            >
              {BRIDE_RELATIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              연락처
            </label>
            <input
              type="tel"
              value={invitation.bride?.phone || ''}
              onChange={(e) => handleBrideChange('phone', e.target.value)}
              placeholder="010-1234-5678"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
