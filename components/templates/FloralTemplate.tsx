"use client";

import type { Invitation } from "@/schemas/invitation";
import { floralTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface FloralTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function FloralTemplate({ data, isPreview = false }: FloralTemplateProps) {
  return <BaseTemplate data={data} theme={floralTheme} isPreview={isPreview} />;
}
