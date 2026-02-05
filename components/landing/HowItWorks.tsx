"use client";

import { ScrollFade } from "@/components/animations/ScrollFade";
import { Upload, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const steps = [
  {
    icon: Upload,
    title: "사진 업로드",
    time: "30초",
    description: "증명사진 또는 정면이 잘 나온 사진 1장을 업로드하세요.",
    tip: "얼굴이 잘 보이는 사진이면 OK",
  },
  {
    icon: Palette,
    title: "스타일 선택",
    time: "1분",
    description: "클래식, 모던, 빈티지 등 원하는 웨딩 스타일을 선택하세요.",
    tip: "템플릿 미리보기 제공",
  },
  {
    icon: Sparkles,
    title: "AI 생성 & 공유",
    time: "2-3분",
    description: "AI가 4장의 웨딩 화보를 생성합니다. 카카오톡으로 바로 공유하세요.",
    tip: "마음에 안 들면 재생성 가능",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-white to-rose-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* 헤딩 */}
          <ScrollFade className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              3단계로 <span className="text-rose-500">간단하게</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              총 소요시간 약 5분, 커피 한 잔 마시는 동안 완성
            </p>
          </ScrollFade>

          {/* 단계 */}
          <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <ScrollFade key={index} delay={0.1 * (index + 1)}>
                <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  {/* 단계 번호 */}
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {index + 1}
                  </div>

                  {/* 아이콘 */}
                  <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
                    <step.icon className="w-8 h-8 text-rose-500" />
                  </div>

                  {/* 제목 & 시간 */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                    <span className="text-sm text-rose-500 bg-rose-100 px-2 py-1 rounded-full">
                      {step.time}
                    </span>
                  </div>

                  {/* 설명 */}
                  <p className="text-gray-600 mb-4">{step.description}</p>

                  {/* 팁 */}
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="text-rose-400">💡</span>
                    {step.tip}
                  </p>

                  {/* 연결선 (마지막 제외) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-rose-200" />
                  )}
                </div>
              </ScrollFade>
            ))}
          </div>

          {/* CTA */}
          <ScrollFade delay={0.4} className="text-center mt-12">
            <Link href="/login">
              <Button size="lg" className="px-8">
                무료로 시작하기
              </Button>
            </Link>
          </ScrollFade>
        </div>
      </div>
    </section>
  );
}
