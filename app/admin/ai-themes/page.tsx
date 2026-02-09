"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/schemas/admin";

interface ThemeItem {
  id: string;
  prompt: string;
  status: "completed" | "safelist_failed";
  failReason: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cost: number | null;
  creditsUsed: number;
  createdAt: string;
  userEmail: string;
  userName: string | null;
}

interface ThemeStats {
  totalCount: number;
  totalCost: number;
  failRate: number;
}

export default function AdminAiThemesPage() {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<ThemeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [status, setStatus] = useState<"" | "completed" | "safelist_failed">("");
  const [page, setPage] = useState(1);

  const fetchThemes = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (status) params.set("status", status);

    try {
      const res = await fetch(`/api/admin/ai-themes?${params}`);
      const data = await res.json();
      if (data.success) {
        setThemes(data.data.themes);
        setPagination(data.data.pagination);
        setStats(data.data.stats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">AI 테마 히스토리</h1>
        <p className="mt-1 text-stone-500">
          AI 테마 생성 기록과 비용을 모니터링하세요
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-sm text-stone-500">총 생성 수</div>
            <div className="text-2xl font-bold text-stone-900 mt-1">{stats.totalCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-sm text-stone-500">총 비용</div>
            <div className="text-2xl font-bold text-stone-900 mt-1">${stats.totalCost.toFixed(4)}</div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-sm text-stone-500">Safelist 실패율</div>
            <div className="text-2xl font-bold text-stone-900 mt-1">{stats.failRate}%</div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | "completed" | "safelist_failed");
            setPage(1);
          }}
          className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="">전체 상태</option>
          <option value="completed">정상</option>
          <option value="safelist_failed">Safelist 실패</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            로딩 중...
          </div>
        ) : themes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            데이터가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 text-left font-medium text-stone-600">유저</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-600">프롬프트</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-600">상태</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-600">토큰 (in/out)</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-600">비용</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-600">생성일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {themes.map((theme) => (
                  <tr key={theme.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="text-stone-900">{theme.userName || '-'}</div>
                      <div className="text-xs text-stone-400">{theme.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="text-stone-700 truncate">{theme.prompt}</p>
                    </td>
                    <td className="px-4 py-3">
                      {theme.status === 'completed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          정상
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          실패
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600 tabular-nums">
                      {theme.inputTokens?.toLocaleString() ?? '-'} / {theme.outputTokens?.toLocaleString() ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600 tabular-nums">
                      ${theme.cost?.toFixed(4) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                      {new Date(theme.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200">
            <div className="text-sm text-stone-500">
              총 {pagination.total}건 중{" "}
              {(pagination.page - 1) * pagination.pageSize + 1}-
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
