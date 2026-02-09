"use client";

import type { SerializableTheme } from "@/lib/templates/types";
import { RSVPForm, type RSVPFormFields } from "./RSVPForm";

interface RSVPSectionProps {
  invitationId: string;
  fields?: RSVPFormFields;
  theme?: SerializableTheme;
  className?: string;
}

export function RSVPSection({ invitationId, fields, theme, className = "" }: RSVPSectionProps) {
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <h2 className={theme?.headingClass ?? "text-lg font-medium text-stone-800 mb-2"}>
          참석 여부
        </h2>
        <p className={theme?.labelClass ?? "text-sm text-stone-500"}>
          참석 여부를 알려주시면 감사하겠습니다
        </p>
      </div>

      <RSVPForm invitationId={invitationId} fields={fields} theme={theme} />
    </div>
  );
}
