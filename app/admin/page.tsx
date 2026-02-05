"use client";

import { useEffect, useState } from "react";
import { Users, Crown, Sparkles, FileHeart, DollarSign, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import type { AdminStatsResponse } from "@/schemas/admin";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || "데이터를 불러오지 못했습니다");
        }
      })
      .catch(() => setError("서버 오류가 발생했습니다"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">관리자 대시보드</h1>
        <p className="mt-1 text-stone-500">서비스 현황을 한눈에 확인하세요</p>
      </div>

      {/* 유저 통계 */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">유저</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="전체 유저" value={stats.users.total} icon={Users} />
          <StatsCard label="프리미엄 유저" value={stats.users.premium} icon={Crown} />
          <StatsCard label="이번 달 신규" value={stats.users.newThisMonth} icon={TrendingUp} />
        </div>
      </section>

      {/* AI 통계 */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">AI 생성</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="총 AI 생성" value={stats.ai.totalGenerations} icon={Sparkles} />
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-500">총 AI 비용</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-stone-900">
              ${stats.ai.totalCost.toFixed(2)}
            </div>
          </div>
          <StatsCard label="이번 달 생성" value={stats.ai.thisMonthGenerations} icon={Sparkles} />
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-500">이번 달 비용</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-stone-900">
              ${stats.ai.thisMonthCost.toFixed(2)}
            </div>
          </div>
        </div>
      </section>

      {/* 매출 통계 */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">매출</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-500">총 매출</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-stone-900">
              {stats.revenue.totalAmount.toLocaleString()}원
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-500">이번 달 매출</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-stone-900">
              {stats.revenue.thisMonthAmount.toLocaleString()}원
            </div>
          </div>
          <StatsCard label="완료된 결제" value={stats.revenue.completedPayments} icon={DollarSign} />
        </div>
      </section>

      {/* 청첩장 통계 */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">청첩장</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="전체 청첩장" value={stats.invitations.total} icon={FileHeart} />
          <StatsCard label="게시됨" value={stats.invitations.published} icon={FileHeart} />
          <StatsCard label="작성 중" value={stats.invitations.draft} icon={FileHeart} />
        </div>
      </section>
    </div>
  );
}
