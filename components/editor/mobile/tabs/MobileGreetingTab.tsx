'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import {
  GREETING_EXAMPLES,
  GREETING_CATEGORIES,
  GREETING_CATEGORY_LABELS,
  type GreetingCategory,
} from '@/lib/copy/greeting-examples';

/**
 * 모바일 인사말 탭
 *
 * 데스크톱 GreetingTab 기반, 모바일 최적화:
 * - textarea rows 10, 풀폭
 * - 예시 카드 세로 스택
 */
export function MobileGreetingTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleGreetingChange = (value: string) => {
    updateInvitation({
      content: {
        ...invitation.content,
        greeting: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 tracking-tight mb-0.5">인사말</h2>
        <p className="text-xs text-stone-500">청첩장에 담을 인사말을 작성하세요</p>
      </div>

      {/* 인사말 입력 */}
      <div className="bg-white rounded-xl p-4 space-y-3 border border-stone-200">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          인사말
        </label>
        <textarea
          value={invitation.content?.greeting || ''}
          onChange={(e) => handleGreetingChange(e.target.value)}
          placeholder="인사말을 입력하세요"
          rows={10}
          className="w-full px-3 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors resize-none placeholder:text-stone-400"
        />
        <p className="text-xs text-stone-500">
          {invitation.content?.greeting?.length || 0} / 500자
        </p>
      </div>

      {/* 예시 인사말 - 카테고리 탭 */}
      <MobileGreetingExamples onSelect={handleGreetingChange} />
    </div>
  );
}

function MobileGreetingExamples({ onSelect }: { onSelect: (text: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<GreetingCategory>('formal');
  const filtered = GREETING_EXAMPLES.filter((e) => e.category === activeCategory);

  return (
    <div className="bg-white rounded-xl p-4 space-y-3 border border-stone-200">
      <h3 className="text-sm font-medium text-stone-700">예시 인사말</h3>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {GREETING_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-shrink-0 ${
              activeCategory === cat
                ? 'bg-pink-500 text-white'
                : 'bg-stone-100 text-stone-600 active:bg-stone-200'
            }`}
          >
            {GREETING_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((example, index) => (
          <button
            key={index}
            onClick={() => onSelect(example.text)}
            className="w-full p-3 text-left border border-stone-200 rounded-lg active:border-pink-300 active:bg-pink-50/50 transition-colors"
          >
            <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">
              {example.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
