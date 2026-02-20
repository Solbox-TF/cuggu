"use client";

import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { GuestbookSection } from "@/components/guestbook/GuestbookSection";

interface GuestbookSectionWrapperProps {
  data: Invitation;
  theme: SerializableTheme;
}

export function GuestbookSectionWrapper({ data, theme }: GuestbookSectionWrapperProps) {
  // enabledSections.guestbook으로 제어 (기본 OFF)
  const enabledSections = (data.extendedData?.enabledSections as Record<string, boolean>) ?? {};
  if (enabledSections.guestbook !== true) return null;

  return (
    <section className={`${theme.sectionPadding} ${theme.sectionBg.rsvp ?? ''}`}>
      <GuestbookSection invitationId={data.id} theme={theme} />
    </section>
  );
}
