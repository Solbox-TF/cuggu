"use client";

import { ScrollFade } from "@/components/animations/ScrollFade";
import { Shield, Lock, Clock, AlertTriangle } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "암호화 URL",
    description: "청첩장 주소가 암호화되어 추측이 불가능합니다",
  },
  {
    icon: Clock,
    title: "90일 자동 삭제",
    description: "결혼식 후 개인정보가 자동으로 삭제됩니다",
  },
  {
    icon: Lock,
    title: "비밀번호 보호",
    description: "원하면 청첩장에 비밀번호를 설정할 수 있습니다",
  },
];

export function SecurityTrust() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* 경고 배지 */}
          <ScrollFade className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4" />
              피싱 청첩장 피해 1,189% 증가
            </div>
          </ScrollFade>

          {/* 헤딩 */}
          <ScrollFade className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-rose-400">🔒</span> 안전한 청첩장
            </h2>
            <p className="text-lg sm:text-xl text-gray-400">
              하객의 개인정보를 안전하게 보호합니다
            </p>
          </ScrollFade>

          {/* 보안 기능 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ScrollFade key={index} delay={0.1 * (index + 1)}>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center hover:border-rose-500/50 transition-colors">
                  <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </ScrollFade>
            ))}
          </div>

          {/* 추가 신뢰 요소 */}
          <ScrollFade delay={0.4}>
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                SSL 암호화
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                GDPR 준수
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                AWS 보안 인프라
              </span>
            </div>
          </ScrollFade>
        </div>
      </div>
    </section>
  );
}
