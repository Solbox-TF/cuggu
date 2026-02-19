"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditTxList } from "@/components/credit/CreditTxList";
import type { CreditTransaction } from "@/types/ai";

interface CreditsTabProps {
  aiCredits: number;
}

export function CreditsTab({ aiCredits }: CreditsTabProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pagination, setPagination] = useState<{
    page: number; pageSize: number; total: number; totalPages: number;
  } | null>(null);
  const [page, setPage] = useState(1);

  const fetchCredits = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/ai/credits?page=${p}&pageSize=10`);
      const result = await res.json();
      if (result.success) {
        setTransactions(result.data.transactions);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error("크레딧 이력 조회 실패:", error);
    }
  }, []);

  useEffect(() => {
    fetchCredits(page);
  }, [page, fetchCredits]);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">AI 크레딧</h2>

        <div className="rounded-lg border border-stone-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-stone-700">남은 크레딧</p>
            <p className="text-2xl font-semibold text-stone-900">
              {aiCredits}회
            </p>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${Math.min((aiCredits / 10) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full px-5 py-3 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors">
            크레딧 구매하기
          </button>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-stone-200 p-3 text-center">
              <p className="text-stone-500">1회</p>
              <p className="text-lg font-semibold text-stone-900 mt-1">1,000원</p>
            </div>
            <div className="rounded-lg border-2 border-rose-200 p-3 text-center">
              <p className="text-stone-500">10회 패키지</p>
              <p className="text-lg font-semibold text-rose-600 mt-1">
                8,000원
                <span className="text-xs text-rose-500 ml-1">20% 할인</span>
              </p>
            </div>
          </div>
        </div>

        {/* 크레딧 이력 */}
        <div className="mt-6 pt-6 border-t border-stone-200">
          <h3 className="text-sm font-medium text-stone-700 mb-3">크레딧 이력</h3>
          <CreditTxList
            transactions={transactions}
            pagination={pagination ?? undefined}
            onPageChange={setPage}
          />
        </div>
      </section>
    </div>
  );
}
