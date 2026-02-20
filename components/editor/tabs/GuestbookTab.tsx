'use client';

import { BookOpen } from 'lucide-react';
import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 방명록 탭
 *
 * - 방명록 활성화/비활성화 토글
 * - 기능 안내
 */
export function GuestbookTab() {
  const { toggleSection, getEnabledSections } = useInvitationEditor();
  const enabledSections = getEnabledSections();
  const enabled = enabledSections.guestbook === true;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">방명록</h2>
        <p className="text-sm text-stone-500">하객들이 축하 메시지를 남길 수 있습니다</p>
      </div>

      {/* 활성화 토글 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-stone-700">방명록 기능</h3>
            <p className="text-xs text-stone-500 mt-1">
              청첩장에 방명록 섹션을 표시합니다
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => toggleSection('guestbook', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500"></div>
          </label>
        </div>

        {enabled && (
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-pink-500" />
              </div>
              <h3 className="text-sm font-medium text-stone-700">기능 안내</h3>
            </div>
            <ul className="text-xs text-stone-500 space-y-2 ml-1">
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#8226;</span>
                하객이 이름과 축하 메시지를 남길 수 있습니다
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#8226;</span>
                비공개 메시지 — 하객이 원하면 신랑·신부만 볼 수 있는 메시지를 작성할 수 있습니다
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#8226;</span>
                비속어 자동 필터링 — 부적절한 표현은 자동으로 차단됩니다
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#8226;</span>
                대시보드에서 메시지 관리 (숨김·삭제) 가능합니다
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
