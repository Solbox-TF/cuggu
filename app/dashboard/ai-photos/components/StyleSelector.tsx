'use client';

import { Check } from 'lucide-react';
import { AIStyle, AI_STYLES } from '@/types/ai';

interface StyleSelectorProps {
  selectedStyle: AIStyle | null;
  onStyleSelect: (style: AIStyle) => void;
  disabled?: boolean;
}

export function StyleSelector({
  selectedStyle,
  onStyleSelect,
  disabled = false,
}: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-700">웨딩 스타일 선택</h3>

      <div className="grid grid-cols-2 gap-2">
        {AI_STYLES.map((style) => {
          const isSelected = selectedStyle === style.value;

          return (
            <button
              key={style.value}
              onClick={() => !disabled && onStyleSelect(style.value)}
              disabled={disabled}
              className={`
                relative rounded-lg border-2 px-3 py-2.5 text-left transition-colors
                ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <div className="space-y-0.5">
                <p className="text-xs font-medium">{style.label}</p>
                <p className="text-[10px] text-stone-500 line-clamp-1">{style.description}</p>
              </div>

              {isSelected && (
                <div className="absolute right-1.5 top-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
