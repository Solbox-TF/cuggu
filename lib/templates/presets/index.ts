import type { SerializableTheme } from '../types';

// ── 카테고리 ──

export type ThemeCategory = 'classic' | 'modern' | 'romantic' | 'elegant' | 'natural';

export const THEME_CATEGORIES: Record<ThemeCategory, { label: string; description: string }> = {
  classic: { label: '클래식', description: '전통적이고 격식있는' },
  modern: { label: '모던', description: '깔끔하고 세련된' },
  romantic: { label: '로맨틱', description: '부드럽고 감성적인' },
  elegant: { label: '엘레강스', description: '고급스럽고 화려한' },
  natural: { label: '내추럴', description: '자연스럽고 편안한' },
};

// ── 프리셋 타입 ──

export interface ThemePreset {
  id: string;
  name: string;
  category: ThemeCategory;
  description: string;
  premium: boolean;
  /** 미니 프리뷰 렌더링용 대표 색상 (hex) */
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  theme: SerializableTheme;
}

// ── 레지스트리 ──

import { classicPresets } from './classic';
import { modernPresets } from './modern';
import { romanticPresets } from './romantic';
import { elegantPresets } from './elegant';
import { naturalPresets } from './natural';

const ALL_PRESETS: ThemePreset[] = [
  ...classicPresets,
  ...modernPresets,
  ...romanticPresets,
  ...elegantPresets,
  ...naturalPresets,
];

const presetMap = new Map(ALL_PRESETS.map((p) => [p.id, p]));

export function getPreset(id: string): ThemePreset {
  return presetMap.get(id) ?? presetMap.get('classic')!;
}

export function getAllPresets(): ThemePreset[] {
  return ALL_PRESETS;
}

export function getPresetsByCategory(category: ThemeCategory): ThemePreset[] {
  return ALL_PRESETS.filter((p) => p.category === category);
}

export function getFreePresets(): ThemePreset[] {
  return ALL_PRESETS.filter((p) => !p.premium);
}

export function getPremiumPresets(): ThemePreset[] {
  return ALL_PRESETS.filter((p) => p.premium);
}

/** backward compat: templateId → SerializableTheme */
export function getTheme(templateId: string): SerializableTheme {
  return getPreset(templateId).theme;
}
