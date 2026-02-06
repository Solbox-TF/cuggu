"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { resolveAnimation } from "@/lib/templates/resolvers";
import { GalleryLightbox } from "../GalleryLightbox";
import { HeadingRenderer } from "../renderers/HeadingRenderer";

interface GallerySectionProps {
  data: Invitation;
  theme: SerializableTheme;
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;
}

export function GallerySection({ data, theme, lightboxIndex, setLightboxIndex }: GallerySectionProps) {
  if (data.gallery.images.length === 0) return null;

  return (
    <section className={`${theme.sectionPadding} ${theme.sectionBg.gallery ?? ''}`}>
      <div className={theme.galleryMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {theme.galleryHeading ? (
            <HeadingRenderer config={theme.galleryHeading} fallbackClass={theme.headingClass}>
              Gallery
            </HeadingRenderer>
          ) : (
            <h2 className={theme.headingClass}>Gallery</h2>
          )}

          <div className={`grid grid-cols-2 md:grid-cols-3 ${theme.galleryGap}`}>
            {data.gallery.images.map((image, index) => {
              const motionProps = resolveAnimation(theme.galleryItemAnimation, index);
              return (
                <motion.div
                  key={index}
                  {...motionProps}
                  viewport={{ once: true }}
                  className={theme.galleryItemClass}
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className={`w-full h-full object-cover ${theme.galleryHover}`}
                  />
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {lightboxIndex !== null && (
              <GalleryLightbox
                images={data.gallery.images}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
