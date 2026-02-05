"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ScrollFade } from "@/components/animations/ScrollFade";
import { Check, X } from "lucide-react";
import Link from "next/link";

export function ProblemSolution() {
  return (
    <>
      {/* Part 1: 문제 제기 */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-stone-100 to-rose-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollFade>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-12">
                웨딩 화보 촬영,
                <br />
                얼마나 드셨나요?
              </h2>
            </ScrollFade>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  emoji: "💸",
                  value: "50-200만원",
                  label: "스튜디오 촬영 비용",
                },
                {
                  emoji: "⏰",
                  value: "반나절",
                  label: "촬영 + 보정 시간",
                },
                {
                  emoji: "😰",
                  value: "예약 필수",
                  label: "인기 스튜디오는 대기",
                },
              ].map((item, index) => (
                <ScrollFade key={index} delay={0.1 * (index + 1)}>
                  <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <div className="text-5xl mb-4">{item.emoji}</div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {item.value}
                    </div>
                    <div className="text-gray-600">{item.label}</div>
                  </div>
                </ScrollFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Part 2: 해결책 */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollFade className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Cuggu는 <span className="text-rose-500">다릅니다</span>
              </h2>
              <p className="text-lg text-gray-600">
                AI 기술로 웨딩 촬영의 모든 부담을 해결합니다
              </p>
            </ScrollFade>

            {/* 비교 테이블 */}
            <ScrollFade delay={0.2}>
              <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-lg">
                <div className="grid grid-cols-3 text-center font-semibold">
                  <div className="p-4 bg-gray-100"></div>
                  <div className="p-4 bg-gray-200 text-gray-700">기존 웨딩 촬영</div>
                  <div className="p-4 bg-rose-500 text-white">Cuggu</div>
                </div>

                {[
                  { label: "비용", old: "50-200만원", new: "9,900원", highlight: true },
                  { label: "소요 시간", old: "4-6시간", new: "2-3분", highlight: true },
                  { label: "예약", old: "필수 (대기 있음)", new: "즉시 생성" },
                  { label: "재촬영", old: "추가 비용", new: "무제한 생성" },
                  { label: "결과물", old: "보정 사진", new: "AI 화보 4장" },
                ].map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 text-center border-t border-gray-200"
                  >
                    <div className="p-4 text-gray-700 font-medium bg-gray-50">
                      {row.label}
                    </div>
                    <div className="p-4 text-gray-600 flex items-center justify-center gap-2">
                      <X className="w-4 h-4 text-red-400" />
                      {row.old}
                    </div>
                    <div
                      className={`p-4 flex items-center justify-center gap-2 ${
                        row.highlight
                          ? "text-rose-600 font-bold bg-rose-50"
                          : "text-gray-900"
                      }`}
                    >
                      <Check className="w-4 h-4 text-green-500" />
                      {row.new}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollFade>

            {/* CTA */}
            <ScrollFade delay={0.3} className="text-center mt-10">
              <Link href="/login">
                <Button size="lg" className="px-8">
                  지금 바로 시작하기
                </Button>
              </Link>
            </ScrollFade>
          </div>
        </div>
      </section>
    </>
  );
}
