"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { UserTable } from "@/components/admin/UserTable";
import { UserActionModal } from "@/components/admin/UserActionModal";
import type { AdminUserItem, PaginationMeta } from "@/schemas/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 필터
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<"" | "FREE" | "PREMIUM">("");
  const [page, setPage] = useState(1);

  // 모달
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("search", search);
    if (plan) params.set("plan", plan);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, search, plan]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (
    userId: string,
    action: "grant_credits" | "set_premium" | "set_free" | "set_admin" | "set_user"
  ) => {
    if (action === "grant_credits") {
      setModalUserId(userId);
      return;
    }

    // 플랜 변경은 바로 실행
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "처리 실패");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantCredits = async (credits: number) => {
    if (!modalUserId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant_credits",
          userId: modalUserId,
          credits,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalUserId(null);
        fetchUsers();
      } else {
        alert(data.error || "처리 실패");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">유저 관리</h1>
        <p className="mt-1 text-stone-500">
          가입한 유저들을 관리하고 크레딧을 부여하세요
        </p>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이메일 또는 이름 검색"
              className="pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800"
          >
            검색
          </button>
        </form>

        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value as "" | "FREE" | "PREMIUM");
            setPage(1);
          }}
          className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="">전체 플랜</option>
          <option value="FREE">무료</option>
          <option value="PREMIUM">프리미엄</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            로딩 중...
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            유저가 없습니다
          </div>
        ) : (
          <UserTable users={users} onAction={handleAction} />
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-200">
            <div className="text-sm text-stone-500">
              총 {pagination.total}명 중 {(pagination.page - 1) * pagination.pageSize + 1}-
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

      {/* 크레딧 부여 모달 */}
      <UserActionModal
        isOpen={!!modalUserId}
        onClose={() => setModalUserId(null)}
        onSubmit={handleGrantCredits}
        isLoading={isSubmitting}
      />
    </div>
  );
}
