"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroImpact() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-white pt-16">
      {/* 꽃잎 배경 애니메이션 */}
      <Petals />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* 헤드라인 */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            증명사진 한 장으로
            <br />
            <span className="text-rose-600">웨딩 화보</span>가 완성됩니다
          </motion.h1>

          {/* 서브 헤드라인 */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            AI가 2-3분 안에 4장의 웨딩 화보를 생성합니다
          </motion.p>

          {/* Before → After 시각화 */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Before: 증명사진 */}
            <div className="relative">
              <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-lg overflow-hidden shadow-lg border-4 border-white bg-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
                  alt="증명사진"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-500 whitespace-nowrap">
                증명사진
              </span>
            </div>

            {/* 화살표 */}
            <motion.div
              className="flex items-center gap-2 text-rose-500"
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="hidden sm:inline text-sm font-medium">2-3분</span>
              <ArrowRight className="w-8 h-8" />
            </motion.div>

            {/* After: AI 화보 4장 */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden shadow-lg border-2 border-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  >
                    <img
                      src={`https://images.unsplash.com/photo-159160446610${i}-ec97de577aff?w=200&q=80`}
                      alt={`AI 웨딩 화보 ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-500 whitespace-nowrap">
                AI 웨딩 화보 4장
              </span>
            </div>
          </motion.div>

          {/* CTA 버튼 */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg">
                무료로 시작하기
              </Button>
            </Link>
            <a href="#before-after">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                AI 사진 샘플 보기
              </Button>
            </a>
          </motion.div>

          {/* 신뢰 배지 */}
          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <span className="flex items-center gap-1">
              <span>💳</span> 신용카드 없이 시작
            </span>
            <span className="flex items-center gap-1">
              <span>✨</span> AI 사진 2회 무료
            </span>
            <span className="flex items-center gap-1">
              <span>🔒</span> 안전한 개인정보 보호
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Hero 영역에만 제한된 꽃잎 애니메이션
function Petals() {
  const petals = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute -top-4 w-4 h-4 rounded-full bg-rose-200/40"
          style={{ left: `${petal.x}%` }}
          animate={{
            y: ["0vh", "100vh"],
            x: [0, Math.sin(petal.id) * 30, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
