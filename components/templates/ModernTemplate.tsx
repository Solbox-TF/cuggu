"use client";

import type { Invitation } from "@/schemas/invitation";
import { modernTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface ModernTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ModernTemplate({ data, isPreview = false }: ModernTemplateProps) {
  return <BaseTemplate data={data} theme={modernTheme} isPreview={isPreview} />;
}
