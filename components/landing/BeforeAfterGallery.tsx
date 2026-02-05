"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ScrollFade } from "@/components/animations/ScrollFade";
import Link from "next/link";

const styles = [
  {
    id: "classic",
    name: "클래식",
    before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    after: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80",
    time: "2분 32초",
  },
  {
    id: "modern",
    name: "모던",
    before: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    after: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    time: "2분 45초",
  },
  {
    id: "vintage",
    name: "빈티지",
    before: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80",
    after: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
    time: "3분 10초",
  },
];

export function BeforeAfterGallery() {
  const [activeStyle, setActiveStyle] = useState(styles[0]);
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    rect: DOMRect
  ) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <section id="before-after" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* 헤딩 */}
          <ScrollFade className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Before <span className="text-rose-500">&</span> After
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              AI가 만드는 놀라운 변화를 직접 확인하세요
            </p>
          </ScrollFade>

          {/* 스타일 탭 */}
          <ScrollFade delay={0.1} className="flex justify-center gap-2 mb-8">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setActiveStyle(style);
                  setSliderPosition(50);
                }}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeStyle.id === style.id
                    ? "bg-rose-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {style.name}
              </button>
            ))}
          </ScrollFade>

          {/* Before/After 슬라이더 */}
          <ScrollFade delay={0.2}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStyle.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl mb-8 cursor-ew-resize"
                onMouseMove={(e) => {
                  if (e.buttons === 1) {
                    handleSliderMove(e, e.currentTarget.getBoundingClientRect());
                  }
                }}
                onTouchMove={(e) => {
                  handleSliderMove(e, e.currentTarget.getBoundingClientRect());
                }}
                onMouseDown={(e) => {
                  handleSliderMove(e, e.currentTarget.getBoundingClientRect());
                }}
              >
                {/* Before 이미지 */}
                <div className="absolute inset-0">
                  <img
                    src={activeStyle.before}
                    alt="Before - 원본 사진"
                    className="w-full h-full object-cover grayscale"
                    draggable={false}
                  />
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    BEFORE
                  </div>
                </div>

                {/* After 이미지 */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={activeStyle.after}
                    alt="After - AI 웨딩 사진"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute top-4 right-4 bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    AFTER
                  </div>
                </div>

                {/* 슬라이더 핸들 */}
                <div
                  className="absolute inset-y-0 w-1 bg-white/80"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                      />
                    </svg>
                  </div>
                </div>

                {/* 드래그 힌트 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  좌우로 드래그해보세요
                </div>
              </motion.div>
            </AnimatePresence>
          </ScrollFade>

          {/* 통계 */}
          <ScrollFade delay={0.3}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[
                { value: activeStyle.time, label: "생성 시간" },
                { value: "4장", label: "AI 사진" },
                { value: "무료", label: "2회 제공" },
                { value: "98%", label: "만족도" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-500 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollFade>

          {/* CTA */}
          <ScrollFade delay={0.4} className="text-center">
            <Link href="/login">
              <Button size="lg" className="px-8">
                이런 사진 만들기
              </Button>
            </Link>
          </ScrollFade>
        </div>
      </div>
    </section>
  );
}
