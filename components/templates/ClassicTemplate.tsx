"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Phone } from "lucide-react";
import { Invitation } from "@/schemas/invitation";
import {
  formatWeddingDate,
  formatWeddingTime,
  formatWeddingDateTime,
} from "@/lib/utils/date";
import { GalleryLightbox } from "./GalleryLightbox";
import { formatFamilyName } from "@/lib/utils/family-display";

interface ClassicTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ClassicTemplate({ data, isPreview = false }: ClassicTemplateProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const weddingDate = new Date(data.wedding.date);

  // 날짜 포맷팅
  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);
  const fullDateStr = formatWeddingDateTime(weddingDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50">
      {/* 커버 섹션 */}
      <section className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center overflow-hidden py-16 md:py-12">
        {/* 배경 이미지 */}
        {data.gallery.coverImage && (
          <div className="absolute inset-0">
            <img
              src={data.gallery.coverImage}
              alt="Wedding Cover"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
          </div>
        )}

        {/* 커버 콘텐츠 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-6"
        >
          {/* 장식 */}
          <div className="text-5xl md:text-6xl mb-6">✨</div>

          {/* 제목 */}
          <h1 className="font-serif text-xs md:text-sm tracking-[0.3em] text-amber-800 mb-6 md:mb-8 uppercase">
            Wedding Invitation
          </h1>

          {/* 이름 */}
          <div className="space-y-3 md:space-y-4 mb-8 md:mb-12">
            <p className="font-serif text-3xl md:text-4xl text-gray-800">
              {data.groom.name}
            </p>
            <p className="text-xl md:text-2xl text-amber-600">&</p>
            <p className="font-serif text-3xl md:text-4xl text-gray-800">
              {data.bride.name}
            </p>
          </div>

          {/* 날짜 */}
          <div className="space-y-1 md:space-y-2">
            <p className="text-base md:text-lg text-gray-600">{dateStr}</p>
            <p className="text-base md:text-lg text-gray-600">{timeStr}</p>
            <p className="text-base md:text-lg text-gray-600 mt-3 md:mt-4">
              {data.wedding.venue.name}
              {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
            </p>
          </div>

        </motion.div>
      </section>

      {/* 인사말 섹션 */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* 장식 */}
            <div className="text-3xl md:text-4xl mb-6 md:mb-8">🌸</div>

            {/* 인사말 */}
            <div className="space-y-4 md:space-y-6">
              <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {data.content.greeting}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 신랑/신부 정보 섹션 */}
      {data.settings.showParents && (
        <section className="py-12 md:py-16 px-6 bg-amber-50/30">
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* 신랑 측 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-xs md:text-sm text-amber-800 mb-3 md:mb-4 font-medium">
                  {formatFamilyName(data.groom) || "신랑"}
                </p>
                <h3 className="text-2xl md:text-3xl font-serif text-gray-800 mb-3 md:mb-4">
                  {data.groom.name}
                </h3>
                {data.groom.phone && (
                  <a
                    href={`tel:${data.groom.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors py-2 px-3 -mx-3 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.groom.phone}
                  </a>
                )}
              </motion.div>

              {/* 신부 측 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-xs md:text-sm text-amber-800 mb-3 md:mb-4 font-medium">
                  {formatFamilyName(data.bride) || "신부"}
                </p>
                <h3 className="text-2xl md:text-3xl font-serif text-gray-800 mb-3 md:mb-4">
                  {data.bride.name}
                </h3>
                {data.bride.phone && (
                  <a
                    href={`tel:${data.bride.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors py-2 px-3 -mx-3 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.bride.phone}
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* 예식 정보 섹션 */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-4 md:space-y-6"
          >
            {/* 날짜/시간 */}
            <div className="flex items-start gap-3 md:gap-4 p-4 md:p-6 bg-white rounded-lg shadow-sm border border-amber-100">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm md:text-base text-gray-800 mb-1 md:mb-2">예식 일시</h4>
                <p className="text-sm md:text-base text-gray-600">{fullDateStr}</p>
              </div>
            </div>

            {/* 장소 */}
            <div className="flex items-start gap-3 md:gap-4 p-4 md:p-6 bg-white rounded-lg shadow-sm border border-amber-100">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm md:text-base text-gray-800 mb-1 md:mb-2">예식 장소</h4>
                <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                  {data.wedding.venue.name}
                  {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
                </p>
                <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                  {data.wedding.venue.address}
                </p>
                {data.wedding.venue.tel && (
                  <a
                    href={`tel:${data.wedding.venue.tel}`}
                    className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 py-2 -ml-2 pl-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.wedding.venue.tel}
                  </a>
                )}
              </div>
            </div>

            {/* 안내사항 */}
            {data.content.notice && (
              <div className="p-4 md:p-6 bg-amber-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  {data.content.notice}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 갤러리 섹션 */}
      {data.gallery.images.length > 0 && (
        <section className="py-12 md:py-20 px-6 bg-amber-50/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-xl md:text-2xl font-serif text-center text-gray-800 mb-8 md:mb-12">
                Gallery
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {data.gallery.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
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
      )}

      {/* 계좌번호 섹션 */}
      {data.settings.showAccounts &&
        (data.groom.account ||
          (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
          (data.groom.parentAccounts?.mother?.length ?? 0) > 0 ||
          data.bride.account ||
          (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
          (data.bride.parentAccounts?.mother?.length ?? 0) > 0) && (
          <section className="py-12 md:py-20 px-6">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-xl md:text-2xl font-serif text-center text-gray-800 mb-8 md:mb-12">
                  마음 전하실 곳
                </h2>

                <div className="space-y-6 md:space-y-8">
                  {/* 신랑 측 */}
                  {(data.groom.account ||
                    (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
                    (data.groom.parentAccounts?.mother?.length ?? 0) > 0) && (
                    <div>
                      <p className="text-sm md:text-base text-amber-800 mb-3 font-semibold">
                        신랑 측
                      </p>
                      <div className="space-y-3">
                        {/* 본인 계좌 */}
                        {data.groom.account && (
                          <div className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100">
                            <p className="text-xs text-slate-500 mb-2">신랑 본인</p>
                            <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                              {data.groom.name}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              {data.groom.account.bank} {data.groom.account.accountNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              예금주: {data.groom.account.accountHolder}
                            </p>
                          </div>
                        )}

                        {/* 아버지 계좌들 */}
                        {data.groom.parentAccounts?.father?.map((account, idx) => (
                          <div
                            key={`groom-father-${idx}`}
                            className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100"
                          >
                            <p className="text-xs text-slate-500 mb-2">
                              아버지{' '}
                              {data.groom.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                            </p>
                            <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                              {data.groom.fatherName || '아버지'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              {account.bank} {account.accountNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              예금주: {account.accountHolder}
                            </p>
                          </div>
                        ))}

                        {/* 어머니 계좌들 */}
                        {data.groom.parentAccounts?.mother?.map((account, idx) => (
                          <div
                            key={`groom-mother-${idx}`}
                            className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100"
                          >
                            <p className="text-xs text-slate-500 mb-2">
                              어머니{' '}
                              {data.groom.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                            </p>
                            <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                              {data.groom.motherName || '어머니'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              {account.bank} {account.accountNumber}
                            </p>
                            <p className="text-xs text-gray-500">
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
                      <p className="text-sm md:text-base text-amber-800 mb-3 font-semibold">
                        신부 측
                      </p>
                      <div className="space-y-3">
                        {/* 본인 계좌 */}
                        {data.bride.account && (
                          <div className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100">
                            <p className="text-xs text-slate-500 mb-2">신부 본인</p>
                            <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                              {data.bride.name}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              {data.bride.account.bank} {data.bride.account.accountNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              예금주: {data.bride.account.accountHolder}
                            </p>
                          </div>
                        )}

                        {/* 아버지 계좌들 */}
                        {data.bride.parentAccounts?.father?.map((account, idx) => (
                          <div
                            key={`bride-father-${idx}`}
                            className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100"
                          >
                            <p className="text-xs text-slate-500 mb-2">
                              아버지{' '}
                              {data.bride.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                            </p>
                            <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                              {data.bride.fatherName || '아버지'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              {account.bank} {account.accountNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              예금주: {account.accountHolder}
                            </p>
                          </div>
                        ))}

                        {/* 어머니 계좌들 */}
                        {data.bride.parentAccounts?.mother?.map((account, idx) => (
                          <div
                            key={`bride-mother-${idx}`}
                            className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100"
                          >
                            <p className="text-xs text-slate-500 mb-2">
                              어머니{' '}
                              {data.bride.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                            </p>
                            <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                              {data.bride.motherName || '어머니'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              {account.bank} {account.accountNumber}
                            </p>
                            <p className="text-xs text-gray-500">
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
        )}

      {/* Footer */}
      <footer className="py-8 md:py-12 px-6 text-center text-xs md:text-sm text-gray-500 border-t border-amber-100">
        <p>© {new Date().getFullYear()} {data.groom.name} & {data.bride.name}</p>
        {!isPreview && (
          <p className="mt-2">
            Made with{" "}
            <a
              href="https://cuggu.io"
              className="text-amber-600 hover:text-amber-700"
            >
              Cuggu
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}
