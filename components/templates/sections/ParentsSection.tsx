"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { resolveAnimation } from "@/lib/templates/resolvers";
import { formatFamilyName } from "@/lib/utils/family-display";
import { HeadingRenderer } from "../renderers/HeadingRenderer";

interface ParentsSectionProps {
  data: Invitation;
  theme: SerializableTheme;
}

function PersonCard({
  person,
  side,
  theme,
  motionProps,
}: {
  person: Invitation['groom'] | Invitation['bride'];
  side: 'groom' | 'bride';
  theme: SerializableTheme;
  motionProps: object;
}) {
  const roleLabel = side === 'groom' ? 'Groom' : 'Bride';
  const familyNameClass = theme.parentsRoleLabel
    ? (theme.parentsFamilyNameClass ?? theme.labelClass)
    : theme.labelClass;

  const content = (
    <>
      {theme.parentsRoleLabel && (
        <p className={theme.labelClass}>{roleLabel}</p>
      )}
      <p className={familyNameClass}>
        {formatFamilyName(person) || (side === 'groom' ? '신랑' : '신부')}
      </p>
      <h3 className={theme.nameClass}>{person.name}</h3>
      {person.phone && (
        <a href={`tel:${person.phone}`} className={theme.phoneLinkClass}>
          <Phone className="w-4 h-4" />
          {person.phone}
        </a>
      )}
    </>
  );

  return (
    <motion.div {...motionProps} viewport={{ once: true }} className="text-center">
      {theme.parentsCardWrapper ? (
        <div className={theme.parentsCardWrapper}>{content}</div>
      ) : (
        content
      )}
    </motion.div>
  );
}

export function ParentsSection({ data, theme }: ParentsSectionProps) {
  if (!data.settings.showParents) return null;

  const groomMotion = resolveAnimation(theme.groomAnimation);
  const brideMotion = resolveAnimation(theme.brideAnimation);

  return (
    <section
      className={`flex items-center justify-center ${theme.sectionPadding} ${theme.sectionBg.parents ?? ''}`}
      style={{ minHeight: 'var(--screen-height, 100vh)' }}
    >
      <div className={`${theme.contentMaxWidth} w-full`}>
        {theme.parentsHeading && (
          <HeadingRenderer config={theme.parentsHeading} fallbackClass={theme.headingClass}>
            Bride &amp; Groom
          </HeadingRenderer>
        )}
        <div className={theme.parentsGrid}>
          <PersonCard
            person={data.groom}
            side="groom"
            theme={theme}
            motionProps={groomMotion}
          />
          <PersonCard
            person={data.bride}
            side="bride"
            theme={theme}
            motionProps={brideMotion}
          />
        </div>
      </div>
    </section>
  );
}
