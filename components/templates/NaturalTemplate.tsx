"use client";

import type { Invitation } from "@/schemas/invitation";
import { naturalTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface NaturalTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function NaturalTemplate({ data, isPreview = false }: NaturalTemplateProps) {
  return <BaseTemplate data={data} theme={naturalTheme} isPreview={isPreview} />;
}
