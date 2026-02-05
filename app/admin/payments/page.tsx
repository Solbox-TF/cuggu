"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaymentTable } from "@/components/admin/PaymentTable";
import type { AdminPaymentItem, PaginationMeta } from "@/schemas/admin";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // 필터
  const [status, setStatus] = useState<"" | "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED">("");
  const [type, setType] = useState<"" | "PREMIUM_UPGRADE" | "AI_CREDITS" | "AI_CREDITS_BUNDLE">("");
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (status) params.set("status", status);
    if (type) params.set("type", type);

    try {
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, status, type]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">결제 내역</h1>
        <p className="mt-1 text-stone-500">모든 결제 내역을 확인하세요</p>
      </div>

      {/* 요약 */}
      <div className="flex gap-4">
        <div className="bg-white rounded-lg border border-stone-200 px-4 py-3">
          <div className="text-sm text-stone-500">필터 결과 건수</div>
          <div className="text-lg font-semibold tabular-nums">
            {summary.count.toLocaleString()}건
          </div>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 px-4 py-3">
          <div className="text-sm text-stone-500">필터 결과 총액</div>
          <div className="text-lg font-semibold tabular-nums">
            {summary.totalAmount.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
          className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="">전체 상태</option>
          <option value="PENDING">대기</option>
          <option value="COMPLETED">완료</option>
          <option value="FAILED">실패</option>
          <option value="REFUNDED">환불</option>
        </select>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as typeof type);
            setPage(1);
          }}
          className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="">전체 타입</option>
          <option value="PREMIUM_UPGRADE">프리미엄 업그레이드</option>
          <option value="AI_CREDITS">AI 크레딧</option>
          <option value="AI_CREDITS_BUNDLE">AI 크레딧 번들</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            로딩 중...
          </div>
        ) : payments.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            결제 내역이 없습니다
          </div>
        ) : (
          <PaymentTable payments={payments} />
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-200">
            <div className="text-sm text-stone-500">
              총 {pagination.total}건 중 {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="p-2 hover:bg-stone-100 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 hover:bg-stone-100 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
