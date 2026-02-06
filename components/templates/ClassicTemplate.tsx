"use client";

import type { Invitation } from "@/schemas/invitation";
import { classicTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface ClassicTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ClassicTemplate({ data, isPreview = false }: ClassicTemplateProps) {
  return <BaseTemplate data={data} theme={classicTheme} isPreview={isPreview} />;
}
