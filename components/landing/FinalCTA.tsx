"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ScrollFade } from "@/components/animations/ScrollFade";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-r from-rose-500 to-pink-500 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollFade>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              지금 시작하면
              <br />
              AI 사진 생성 2회 무료
            </h2>
          </ScrollFade>

          <ScrollFade delay={0.1}>
            <p className="text-lg sm:text-xl text-white/90 mb-10">
              50-200만원 웨딩 촬영 비용, 9,900원으로 해결하세요
            </p>
          </ScrollFade>

          <ScrollFade delay={0.2}>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 bg-white text-rose-600 border-white hover:bg-white/90 shadow-xl"
              >
                무료로 청첩장 만들기
              </Button>
            </Link>
          </ScrollFade>

          <ScrollFade delay={0.3}>
            <p className="mt-6 text-white/80 text-sm flex items-center justify-center gap-2">
              <span>💳</span>
              신용카드 등록 없이 바로 시작
            </p>
          </ScrollFade>

          {/* 추가 신뢰 요소 */}
          <ScrollFade delay={0.4}>
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/70 text-sm">
              <span>✓ 일회성 구매, 구독 없음</span>
              <span>✓ 90일 후 자동 삭제</span>
              <span>✓ 개인정보 안전 보호</span>
            </div>
          </ScrollFade>
        </div>
      </div>
    </section>
  );
}
