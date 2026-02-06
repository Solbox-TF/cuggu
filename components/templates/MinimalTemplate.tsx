"use client";

import type { Invitation } from "@/schemas/invitation";
import { minimalTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface MinimalTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function MinimalTemplate({ data, isPreview = false }: MinimalTemplateProps) {
  return <BaseTemplate data={data} theme={minimalTheme} isPreview={isPreview} />;
}
