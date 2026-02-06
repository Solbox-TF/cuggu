"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { Invitation, SectionId } from "@/schemas/invitation";
import { sanitizeSectionOrder } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { GreetingSection } from "./sections/GreetingSection";
import { ParentsSection } from "./sections/ParentsSection";
import { CeremonySection } from "./sections/CeremonySection";
import { MapInfoSection } from "./sections/MapInfoSection";
import { GallerySection } from "./sections/GallerySection";
import { AccountsSection } from "./sections/AccountsSection";
import { RsvpSectionWrapper } from "./sections/RsvpSectionWrapper";
import { CoverSection } from "./CoverSection";
import { FooterSection } from "./FooterSection";
import { DividerRenderer } from "./renderers/DividerRenderer";

interface BaseTemplateProps {
  data: Invitation;
  theme: SerializableTheme;
  isPreview?: boolean;
}

export function BaseTemplate({ data, theme, isPreview }: BaseTemplateProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sectionOrder = sanitizeSectionOrder(data.settings.sectionOrder as SectionId[] | undefined);

  const sections: Record<SectionId, () => ReactNode> = {
    greeting: () => <GreetingSection data={data} theme={theme} />,
    parents: () => <ParentsSection data={data} theme={theme} />,
    ceremony: () => <CeremonySection data={data} theme={theme} />,
    map: () => <MapInfoSection data={data} theme={theme} />,
    gallery: () => (
      <GallerySection
        data={data}
        theme={theme}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
      />
    ),
    accounts: () => <AccountsSection data={data} theme={theme} />,
    rsvp: () => <RsvpSectionWrapper data={data} theme={theme} />,
  };

  // 렌더 가능한 섹션만 필터링
  const renderedSections = sectionOrder
    .map((id) => ({ id, node: sections[id]() }))
    .filter(({ node }) => node !== null);

  return (
    <div className={theme.containerBg}>
      <CoverSection data={data} config={theme.cover} />
      <DividerRenderer config={theme.postCoverDivider} />

      {renderedSections.map(({ id, node }, idx) => (
        <Fragment key={id}>
          {idx > 0 && <DividerRenderer config={theme.sectionDivider} />}
          {node}
        </Fragment>
      ))}

      <FooterSection data={data} config={theme.footer} isPreview={isPreview} />
    </div>
  );
}
