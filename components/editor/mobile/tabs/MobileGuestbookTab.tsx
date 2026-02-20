'use client';

import { BookOpen } from 'lucide-react';
import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 모바일 방명록 탭
 *
 * 데스크톱 GuestbookTab 기반, 모바일 최적화 (44px 터치 타겟)
 */
export function MobileGuestbookTab() {
  const { toggleSection, getEnabledSections } = useInvitationEditor();
  const enabledSections = getEnabledSections();
  const enabled = enabledSections.guestbook === true;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900 tracking-tight mb-0.5">방명록</h2>
        <p className="text-xs text-stone-500">하객들이 축하 메시지를 남길 수 있습니다</p>
      </div>

      <div className="bg-white rounded-xl p-4 space-y-4 border border-stone-200">
        <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
          <div>
            <h3 className="text-sm font-medium text-stone-700">방명록 기능</h3>
            <p className="text-xs text-stone-500 mt-0.5">청첩장에 방명록 섹션을 표시합니다</p>
          </div>
          <div className="relative inline-flex items-center flex-shrink-0 ml-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => toggleSection('guestbook', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500" />
          </div>
        </label>

        {enabled && (
          <div className="pt-3 border-t border-stone-100">
            <ul className="text-xs text-stone-500 space-y-1.5 ml-1">
              <li>&#8226; 이름 + 축하 메시지 작성</li>
              <li>&#8226; 비공개 메시지 (신랑·신부 전용)</li>
              <li>&#8226; 비속어 자동 필터링</li>
              <li>&#8226; 대시보드에서 관리 가능</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
