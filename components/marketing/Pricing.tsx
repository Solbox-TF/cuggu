"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Check } from "lucide-react";
import { ScrollFade } from "@/components/animations/ScrollFade";
import Link from "next/link";

const plans = [
  {
    name: "무료",
    price: "0원",
    description: "기본 기능으로 시작하기",
    features: [
      "기본 템플릿 5개",
      "AI 사진 생성 2회",
      "갤러리 20장",
      "RSVP 기능",
      "하단 Cuggu 로고",
    ],
  },
  {
    name: "프리미엄",
    price: "9,900원",
    description: "모든 기능 이용하기",
    popular: true,
    features: [
      "프리미엄 템플릿 20개+",
      "AI 사진 생성 10회",
      "갤러리 100장",
      "RSVP 기능",
      "로고 제거",
      "비밀번호 보호",
      "커스텀 폰트 & 애니메이션",
    ],
  },
];

export function Pricing() {
  return (
    <section className="py-24 md:py-32 px-4 bg-gray-50" id="pricing">
      <div className="container mx-auto max-w-5xl">
        {/* 비교 강조 배지 */}
        <ScrollFade className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm font-medium">
            <span className="line-through text-gray-500">웨딩 촬영 50-200만원</span>
            <span>→</span>
            <span className="font-bold">Cuggu 9,900원</span>
          </div>
        </ScrollFade>

        <ScrollFade>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            가격 안내
          </h2>
        </ScrollFade>
        <ScrollFade delay={0.1}>
          <p className="text-center text-gray-600 mb-4">
            일회성 구매, 월 구독 없음
          </p>
          <p className="text-center text-sm text-rose-600 font-medium mb-12">
            ✓ 한 번 결제하면 평생 사용
          </p>
        </ScrollFade>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <ScrollFade key={plan.name} delay={0.1 * (index + 2)}>
              <Card
                className={
                  plan.popular
                    ? "border-rose-500 border-2 shadow-xl relative"
                    : "border-gray-200"
                }
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                    가장 인기
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600"> / 1회</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/login" className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.price === "0원" ? "무료로 시작하기" : "구매하기"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </ScrollFade>
          ))}
        </div>
        <ScrollFade delay={0.4}>
          <div className="mt-8 text-center text-sm text-gray-500">
            💰 추가 AI 크레딧: 1,000원/회 | 10회 패키지: 8,000원 (20% 할인)
          </div>
        </ScrollFade>
      </div>
    </section>
  );
}
