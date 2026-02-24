"use client";

import { BaseTemplate } from "@/components/templates/BaseTemplate";
import { getTheme } from "@/lib/templates/presets";
import { SAMPLE_INVITATION } from "@/schemas/invitation";

export default function TemplatePreviewPage() {
  return <BaseTemplate data={SAMPLE_INVITATION} theme={getTheme('classic')} isPreview />;
}
