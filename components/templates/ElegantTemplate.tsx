"use client";

import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Phone } from "lucide-react";
import {
  Invitation,
  sanitizeSectionOrder,
  type SectionId,
} from "@/schemas/invitation";
import {
  formatWeddingDate,
  formatWeddingTime,
  formatWeddingDateTime,
} from "@/lib/utils/date";
import { GalleryLightbox } from "./GalleryLightbox";
import { MapSection } from "./MapSection";
import { NavigationButtons } from "./NavigationButtons";
import { formatFamilyName } from "@/lib/utils/family-display";
import { RSVPSection } from "@/components/rsvp/RSVPSection";

interface ElegantTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

/**
 * Elegant 템플릿 - 호텔웨딩 고급 스타일
 * 컬러: 네이비/골드, 아이보리 배경
 * 특징: 고급 타이포그래피, 금장 느낌
 */
export function ElegantTemplate({ data, isPreview = false }: ElegantTemplateProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const weddingDate = new Date(data.wedding.date);

  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);
  const fullDateStr = formatWeddingDateTime(weddingDate);

  const sectionOrder = sanitizeSectionOrder(data.settings.sectionOrder as SectionId[] | undefined);

  const hasAccounts =
    data.groom.account ||
    (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.groom.parentAccounts?.mother?.length ?? 0) > 0 ||
    data.bride.account ||
    (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.bride.parentAccounts?.mother?.length ?? 0) > 0;

  const sections: Record<SectionId, () => React.ReactNode> = {
    greeting: () => (
      <section
        key="greeting"
        className="flex items-center justify-center py-16 md:py-24 px-6"
        style={{ minHeight: 'var(--screen-height, 100vh)' }}
      >
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* 골드 장식 */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60" />
              <div className="w-2 h-2 rotate-45 border border-amber-400/60" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/60" />
            </div>

            <p className="text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-line font-light">
              {data.content.greeting}
            </p>

            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60" />
              <div className="w-2 h-2 rotate-45 border border-amber-400/60" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/60" />
            </div>
          </motion.div>
        </div>
      </section>
    ),

    parents: () => {
      if (!data.settings.showParents) return null;
      return (
        <section
          key="parents"
          className="flex items-center justify-center px-6 bg-slate-800"
          style={{ minHeight: 'var(--screen-height, 100vh)' }}
        >
          <div className="max-w-2xl w-full">
            <div className="grid md:grid-cols-2 gap-10">
              {/* 신랑 측 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-xs tracking-[0.3em] text-amber-400/80 uppercase mb-4">
                  Groom
                </p>
                <p className="text-xs text-slate-400 mb-2">
                  {formatFamilyName(data.groom) || "신랑"}
                </p>
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-3">
                  {data.groom.name}
                </h3>
                {data.groom.phone && (
                  <a
                    href={`tel:${data.groom.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.groom.phone}
                  </a>
                )}
              </motion.div>

              {/* 신부 측 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <p className="text-xs tracking-[0.3em] text-amber-400/80 uppercase mb-4">
                  Bride
                </p>
                <p className="text-xs text-slate-400 mb-2">
                  {formatFamilyName(data.bride) || "신부"}
                </p>
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-3">
                  {data.bride.name}
                </h3>
                {data.bride.phone && (
                  <a
                    href={`tel:${data.bride.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.bride.phone}
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      );
    },

    ceremony: () => (
      <section key="ceremony" className="py-16 md:py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* 날짜/시간 */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Calendar className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs tracking-[0.2em] text-slate-400 uppercase mb-2">Date & Time</h4>
                <p className="text-base text-slate-800">{fullDateStr}</p>
              </div>
            </div>

            {/* 장소 */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
              <MapPin className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs tracking-[0.2em] text-slate-400 uppercase mb-2">Location</h4>
                <p className="text-base text-slate-800 font-medium">
                  {data.wedding.venue.name}
                  {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {data.wedding.venue.address}
                </p>
                {data.wedding.venue.tel && (
                  <a
                    href={`tel:${data.wedding.venue.tel}`}
                    className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 mt-2 py-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.wedding.venue.tel}
                  </a>
                )}
              </div>
            </div>

            {/* 안내사항 */}
            {data.content.notice && (
              <div className="p-6 bg-amber-50/50 rounded-lg border border-amber-100">
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {data.content.notice}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    ),

    map: () => {
      if (!data.settings.showMap || !data.wedding.venue.lat || !data.wedding.venue.lng) {
        return null;
      }
      return (
        <section key="map" className="py-16 md:py-24 px-6 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* 타이틀 */}
              <div className="text-center mb-10">
                <p className="text-xs tracking-[0.3em] text-amber-500 uppercase mb-2">Location</p>
                <h2 className="text-xl md:text-2xl font-serif text-slate-800">오시는 길</h2>
              </div>

              <MapSection
                lat={data.wedding.venue.lat}
                lng={data.wedding.venue.lng}
                venueName={data.wedding.venue.name}
              />

              <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200 text-center">
                <p className="text-base font-medium text-slate-800">
                  {data.wedding.venue.name}
                  {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {data.wedding.venue.address}
                </p>
              </div>

              <NavigationButtons
                lat={data.wedding.venue.lat}
                lng={data.wedding.venue.lng}
                venueName={data.wedding.venue.name}
              />

              {data.wedding.venue.transportation && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">교통편 안내</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {data.wedding.venue.transportation}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      );
    },

    gallery: () => {
      if (data.gallery.images.length === 0) return null;
      return (
        <section key="gallery" className="py-16 md:py-24 px-6 bg-slate-800">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-10">
                <p className="text-xs tracking-[0.3em] text-amber-400/80 uppercase mb-2">Moments</p>
                <h2 className="text-xl md:text-2xl font-serif text-white">Gallery</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.gallery.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="aspect-square overflow-hidden rounded-lg cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </motion.div>
                ))}
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
    },

    accounts: () => {
      if (!data.settings.showAccounts || !hasAccounts) return null;
      return (
        <section key="accounts" className="py-16 md:py-24 px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-10">
                <p className="text-xs tracking-[0.3em] text-amber-500 uppercase mb-2">Gift</p>
                <h2 className="text-xl md:text-2xl font-serif text-slate-800">마음 전하실 곳</h2>
              </div>

              <div className="space-y-8">
                {/* 신랑 측 */}
                {(data.groom.account ||
                  (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
                  (data.groom.parentAccounts?.mother?.length ?? 0) > 0) && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-4 text-center">신랑 측</p>
                    <div className="space-y-3">
                      {data.groom.account && (
                        <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                          <p className="text-xs text-slate-400 mb-1">신랑 본인</p>
                          <p className="text-sm font-medium text-slate-800">{data.groom.name}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {data.groom.account.bank} {data.groom.account.accountNumber}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            예금주: {data.groom.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.groom.parentAccounts?.father?.map((account, idx) => (
                        <div key={`groom-father-${idx}`} className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                          <p className="text-xs text-slate-400 mb-1">
                            아버지{data.groom.parentAccounts!.father.length > 1 && ` (계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {data.groom.fatherName || '아버지'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.groom.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`groom-mother-${idx}`} className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                          <p className="text-xs text-slate-400 mb-1">
                            어머니{data.groom.parentAccounts!.mother.length > 1 && ` (계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {data.groom.motherName || '어머니'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 신부 측 */}
                {(data.bride.account ||
                  (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
                  (data.bride.parentAccounts?.mother?.length ?? 0) > 0) && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-4 text-center">신부 측</p>
                    <div className="space-y-3">
                      {data.bride.account && (
                        <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                          <p className="text-xs text-slate-400 mb-1">신부 본인</p>
                          <p className="text-sm font-medium text-slate-800">{data.bride.name}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {data.bride.account.bank} {data.bride.account.accountNumber}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            예금주: {data.bride.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.bride.parentAccounts?.father?.map((account, idx) => (
                        <div key={`bride-father-${idx}`} className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                          <p className="text-xs text-slate-400 mb-1">
                            아버지{data.bride.parentAccounts!.father.length > 1 && ` (계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {data.bride.fatherName || '아버지'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.bride.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`bride-mother-${idx}`} className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                          <p className="text-xs text-slate-400 mb-1">
                            어머니{data.bride.parentAccounts!.mother.length > 1 && ` (계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {data.bride.motherName || '어머니'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      );
    },

    rsvp: () => {
      if (!data.settings.enableRsvp) return null;
      return (
        <section key="rsvp" className="py-16 md:py-24 px-6 bg-slate-50">
          <RSVPSection invitationId={data.id} fields={data.settings.rsvpFields} />
        </section>
      );
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-slate-50">
      {/* 커버 섹션 */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden px-6"
        style={{ minHeight: 'var(--screen-height, 100vh)' }}
      >
        {data.gallery.coverImage && (
          <div className="absolute inset-0">
            <img
              src={data.gallery.coverImage}
              alt="Wedding Cover"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-white" />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-6"
        >
          {/* 상단 장식 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
            <div className="w-3 h-3 rotate-45 border-2 border-amber-400" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
          </div>

          <p className="text-xs tracking-[0.4em] text-amber-600 uppercase mb-8">
            Wedding Invitation
          </p>

          <div className="space-y-4 mb-10">
            <p className="font-serif text-4xl md:text-5xl text-slate-800">
              {data.groom.name}
            </p>
            <p className="text-2xl text-amber-500 font-light">&</p>
            <p className="font-serif text-4xl md:text-5xl text-slate-800">
              {data.bride.name}
            </p>
          </div>

          {/* 하단 장식 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
            <div className="w-3 h-3 rotate-45 border-2 border-amber-400" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
          </div>

          <div className="space-y-1 text-slate-600">
            <p className="text-sm tracking-wide">{dateStr}</p>
            <p className="text-sm tracking-wide">{timeStr}</p>
            <p className="text-sm tracking-wide mt-4">
              {data.wedding.venue.name}
              {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
            </p>
          </div>
        </motion.div>
      </section>

      {/* 동적 섹션 */}
      {sectionOrder.map((id) => (
        <Fragment key={id}>{sections[id]()}</Fragment>
      ))}

      {/* Footer */}
      <footer className="py-10 md:py-14 px-6 text-center bg-slate-800">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-8 bg-amber-400/40" />
          <div className="w-2 h-2 rotate-45 border border-amber-400/40" />
          <div className="h-px w-8 bg-amber-400/40" />
        </div>
        <p className="text-sm text-slate-400">
          {data.groom.name} & {data.bride.name}
        </p>
        {!isPreview && (
          <p className="mt-2">
            <a
              href="https://cuggu.io"
              className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
            >
              Cuggu
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}
