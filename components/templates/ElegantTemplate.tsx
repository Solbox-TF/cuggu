"use client";

import type { Invitation } from "@/schemas/invitation";
import { elegantTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface ElegantTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ElegantTemplate({ data, isPreview = false }: ElegantTemplateProps) {
  return <BaseTemplate data={data} theme={elegantTheme} isPreview={isPreview} />;
}
