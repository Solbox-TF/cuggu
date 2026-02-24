import type { ComponentType } from 'react';
import type { Invitation } from '@/schemas/invitation';
import type { SerializableTheme } from './types';
import { getTheme } from './presets';

export type TemplateProps = {
  data: Invitation;
  theme: SerializableTheme;
  isPreview?: boolean;
};

/**
 * templateId → SerializableTheme 조회
 * 'custom' + customTheme이 있으면 그대로 반환 (backward compat)
 */
export function resolveTheme(templateId: string, customTheme?: SerializableTheme): SerializableTheme {
  if (templateId === 'custom' && customTheme) {
    return customTheme;
  }
  return getTheme(templateId);
}
