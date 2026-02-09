import type { ComponentType } from 'react';
import type { Invitation } from '@/schemas/invitation';

import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { MinimalTemplate } from '@/components/templates/MinimalTemplate';
import { FloralTemplate } from '@/components/templates/FloralTemplate';
import { ElegantTemplate } from '@/components/templates/ElegantTemplate';
import { NaturalTemplate } from '@/components/templates/NaturalTemplate';

export type TemplateProps = {
  data: Invitation;
  isPreview?: boolean;
};

const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  floral: FloralTemplate,
  elegant: ElegantTemplate,
  natural: NaturalTemplate,
};

export function getTemplateComponent(templateId: string): ComponentType<TemplateProps> {
  return TEMPLATE_MAP[templateId] || ClassicTemplate;
}
