'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { Check, Lock, Sparkles } from 'lucide-react';
import {
  getAllPresets,
  getPresetsByCategory,
  THEME_CATEGORIES,
  type ThemeCategory,
  type ThemePreset,
} from '@/lib/templates/presets';

// ── 미니 프리뷰 (프리셋 색상 기반 자동 생성) ──

function PresetMiniPreview({ preset }: { preset: ThemePreset }) {
  const { primary, secondary, accent, bg } = preset.preview;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 gap-2" style={{ backgroundColor: bg }}>
      {/* 상단 장식 */}
      <div className="w-5 h-5 rounded-full opacity-30" style={{ backgroundColor: accent }} />

      {/* Wedding 라벨 */}
      <div className="text-[5px] tracking-[0.3em] uppercase" style={{ color: primary }}>
        Wedding
      </div>

      {/* 구분선 */}
      <div className="w-6 h-px" style={{ backgroundColor: accent, opacity: 0.4 }} />

      {/* 이름 영역 */}
      <div className="space-y-1 text-center">
        <div className="h-1.5 w-8 rounded-full mx-auto" style={{ backgroundColor: secondary, opacity: 0.6 }} />
        <div className="text-[5px]" style={{ color: accent }}>&</div>
        <div className="h-1.5 w-8 rounded-full mx-auto" style={{ backgroundColor: secondary, opacity: 0.6 }} />
      </div>

      {/* 하단 텍스트 */}
      <div className="space-y-0.5 mt-1">
        <div className="h-0.5 w-10 rounded-full mx-auto" style={{ backgroundColor: primary, opacity: 0.2 }} />
        <div className="h-0.5 w-8 rounded-full mx-auto" style={{ backgroundColor: primary, opacity: 0.2 }} />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──

export function TemplateTab() {
  const { invitation, updateInvitation } = useInvitationEditor();
  const [activeCategory, setActiveCategory] = useState<'all' | ThemeCategory>('all');

  const allPresets = getAllPresets();
  const filteredPresets = activeCategory === 'all'
    ? allPresets
    : getPresetsByCategory(activeCategory);

  const freePresets = filteredPresets.filter((p) => !p.premium);
  const premiumPresets = filteredPresets.filter((p) => p.premium);

  const handleSelect = (presetId: string) => {
    updateInvitation({ templateId: presetId, customTheme: undefined });
  };

  // 기존 custom 테마 적용 중인지
  const isLegacyCustom = invitation.templateId === 'custom' && invitation.customTheme;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">템플릿</h2>
        <p className="text-sm text-stone-500">청첩장 디자인을 선택하세요</p>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          전체
        </button>
        {(Object.entries(THEME_CATEGORIES) as [ThemeCategory, { label: string }][]).map(
          ([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === key
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {/* 레거시 커스텀 테마 알림 */}
      {isLegacyCustom && (
        <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200">
          <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-violet-700">커스텀 테마 적용 중</span>
            <span className="text-xs text-violet-500 ml-2">아래 템플릿을 선택하면 해제됩니다</span>
          </div>
        </div>
      )}

      {/* 무료 프리셋 */}
      {freePresets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-stone-700">무료 템플릿</h3>
            <span className="text-xs text-stone-400">{freePresets.length}개</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {freePresets.map((preset) => {
              const isSelected = invitation.templateId === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  className={`group relative p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'ring-2 ring-pink-500 ring-offset-2 shadow-lg'
                      : 'hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <div className="relative aspect-[3/4] rounded-lg mb-3 overflow-hidden border border-stone-100">
                    <PresetMiniPreview preset={preset} />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg z-10">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-stone-900">{preset.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 프리미엄 프리셋 */}
      {premiumPresets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-stone-700">프리미엄 템플릿</h3>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-pink-500 rounded-full">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">Premium</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {premiumPresets.map((preset) => (
              <div
                key={preset.id}
                className="relative p-3 rounded-xl opacity-75"
              >
                <div className="relative aspect-[3/4] rounded-lg mb-3 overflow-hidden border border-stone-100">
                  <PresetMiniPreview preset={preset} />
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-stone-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-stone-900">{preset.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 프리미엄 업그레이드 CTA (프리미엄 프리셋이 있거나 전체 탭일 때) */}
      {(activeCategory === 'all' || premiumPresets.length > 0) && (
        <div className="bg-pink-50/50 rounded-xl p-4 md:p-6 border border-stone-200">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-pink-500 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-stone-900 mb-1">프리미엄 템플릿</h4>
              <p className="text-sm text-stone-500 mb-4">
                전문가가 디자인한 고급 템플릿을 이용하세요
              </p>
              <button className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                업그레이드 (9,900원)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
