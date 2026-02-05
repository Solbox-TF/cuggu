"use client";

import { ScrollFade } from "@/components/animations/ScrollFade";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "김○○",
    rating: 5,
    text: "증명사진만으로 이런 퀄리티가 나올 줄 몰랐어요. 친구들이 진짜 스튜디오에서 찍은 줄 알았대요!",
    date: "2024.01",
  },
  {
    name: "이○○",
    rating: 5,
    text: "2분만에 웨딩 화보가 나왔어요. 스튜디오 예약하려다가 여기서 해결했습니다. 200만원 아꼈어요.",
    date: "2024.01",
  },
  {
    name: "박○○",
    rating: 5,
    text: "해외에 있어서 촬영이 어려웠는데, Cuggu 덕분에 예쁜 청첩장 완성했어요. 감사합니다!",
    date: "2024.02",
  },
];

const stats = [
  { value: "2,500+", label: "청첩장 생성" },
  { value: "4.8", label: "평균 만족도", suffix: "/5.0" },
  { value: "98%", label: "재사용 의향" },
];

export function SocialProof() {
  return (
    <section className="py-24 md:py-32 bg-rose-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* 헤딩 */}
          <ScrollFade className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              이미 <span className="text-rose-500">1,234쌍</span>의 커플이
              <br />
              선택했습니다
            </h2>
          </ScrollFade>

          {/* 통계 */}
          <ScrollFade delay={0.1}>
            <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-600">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-lg text-gray-400">{stat.suffix}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollFade>

          {/* 후기 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <ScrollFade key={index} delay={0.1 * (index + 2)}>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  {/* 별점 */}
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* 후기 텍스트 */}
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>

                  {/* 작성자 */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{review.name}</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              </ScrollFade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
