'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 모바일 참석 확인 (RSVP) 탭
 *
 * 데스크톱 RsvpTab 기반, 모바일 최적화:
 * - 토글/체크박스 사이즈 키움 (44px 터치 타겟)
 * - 풀폭 레이아웃
 */
export function MobileRsvpTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleSettingsChange = (field: string, value: unknown) => {
    updateInvitation({
      settings: {
        ...invitation.settings,
        [field]: value,
      },
    });
  };

  const rsvpEnabled = invitation.settings?.enableRsvp !== false;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 tracking-tight mb-0.5">참석 확인</h2>
        <p className="text-xs text-stone-500">하객이 참석 여부를 전송할 수 있습니다</p>
      </div>

      {/* RSVP 활성화 토글 */}
      <div className="bg-white rounded-xl p-4 space-y-4 border border-stone-200">
        <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
          <div>
            <h3 className="text-sm font-medium text-stone-700">RSVP 기능</h3>
            <p className="text-xs text-stone-500 mt-0.5">청첩장에 참석 여부 폼을 표시합니다</p>
          </div>
          <div className="relative inline-flex items-center flex-shrink-0 ml-3">
            <input
              type="checkbox"
              checked={rsvpEnabled}
              onChange={(e) => handleSettingsChange('enableRsvp', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500" />
          </div>
        </label>

        {/* RSVP 필드 설정 */}
        {rsvpEnabled && (
          <div className="pt-3 border-t border-stone-100 space-y-1">
            <p className="text-xs font-medium text-stone-500 mb-2">수집할 정보</p>

            {/* 이름 - 필수 */}
            <div className="flex items-center justify-between min-h-[44px] py-1">
              <span className="text-sm text-stone-600">이름</span>
              <span className="text-xs text-stone-400">필수</span>
            </div>

            {/* 연락처 */}
            <label className="flex items-center justify-between min-h-[44px] py-1 cursor-pointer">
              <span className="text-sm text-stone-600">연락처</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.phone !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  phone: e.target.checked,
                })}
                className="w-5 h-5 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>

            {/* 참석 여부 - 필수 */}
            <div className="flex items-center justify-between min-h-[44px] py-1">
              <span className="text-sm text-stone-600">참석 여부</span>
              <span className="text-xs text-stone-400">필수</span>
            </div>

            {/* 동행 인원 */}
            <label className="flex items-center justify-between min-h-[44px] py-1 cursor-pointer">
              <span className="text-sm text-stone-600">동행 인원</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.guestCount !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  guestCount: e.target.checked,
                })}
                className="w-5 h-5 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>

            {/* 식사 */}
            <label className="flex items-center justify-between min-h-[44px] py-1 cursor-pointer">
              <span className="text-sm text-stone-600">식사 옵션</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.meal !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  meal: e.target.checked,
                })}
                className="w-5 h-5 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>

            {/* 축하 메시지 */}
            <label className="flex items-center justify-between min-h-[44px] py-1 cursor-pointer">
              <span className="text-sm text-stone-600">축하 메시지</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.message !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  message: e.target.checked,
                })}
                className="w-5 h-5 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
