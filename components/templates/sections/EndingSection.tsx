"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";

interface EndingSectionProps {
  data: Invitation;
  theme: SerializableTheme;
}

export function EndingSection({ data, theme }: EndingSectionProps) {
  const ending = (data.extendedData as Record<string, unknown>)?.ending as
    | { imageUrl?: string; message?: string }
    | undefined;

  if (!ending?.imageUrl && !ending?.message) return null;

  const imageClass = theme.endingImageClass ?? 'w-full h-64 md:h-80 object-cover';
  const messageClass = theme.endingMessageClass ?? theme.bodyText;
  const bg = theme.sectionBg?.ending ?? '';

  return (
    <section className={`${theme.sectionPadding} ${bg} flex justify-center`}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={`${theme.contentMaxWidth} text-center`}
      >
        {ending.imageUrl && (
          <div className="relative overflow-hidden mb-6">
            <Image
              src={ending.imageUrl}
              alt="엔딩 이미지"
              width={800}
              height={400}
              className={imageClass}
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        {ending.message && (
          <p className={messageClass}>
            {ending.message}
          </p>
        )}
      </motion.div>
    </section>
  );
}
