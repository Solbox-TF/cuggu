"use client";

import { useEffect, useState } from "react";
import { Loader2, BookOpen, Lock, EyeOff } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { GuestbookTable } from "@/components/guestbook/GuestbookTable";
import type { GuestbookEntryOwner } from "@/schemas/guestbook";

interface Invitation {
  id: string;
  groomName: string;
  brideName: string;
}

interface GuestbookStats {
  total: number;
  hiddenCount: number;
  privateCount: number;
}

export default function GuestbookPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<GuestbookEntryOwner[]>([]);
  const [stats, setStats] = useState<GuestbookStats | null>(null);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 청첩장 목록 로드
  useEffect(() => {
    fetchInvitations();
  }, []);

  // 선택된 청첩장의 방명록 로드
  useEffect(() => {
    if (selectedId) {
      fetchGuestbook(selectedId);
    }
  }, [selectedId]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations");
      const result = await response.json();

      if (result.success) {
        const list = result.data.invitations.map((inv: any) => ({
          id: inv.id,
          groomName: inv.groomName,
          brideName: inv.brideName,
        }));
        setInvitations(list);

        if (list.length === 1) {
          setSelectedId(list[0].id);
        }
      }
    } catch (error) {
      console.error("청첩장 목록 조회 실패:", error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const fetchGuestbook = async (invitationId: string) => {
    setIsLoadingEntries(true);
    try {
      const response = await fetch(`/api/invitations/${invitationId}/guestbook`);
      const result = await response.json();

      if (result.success) {
        setEntries(result.data.entries);
        setStats({
          total: result.data.total,
          hiddenCount: result.data.hiddenCount,
          privateCount: result.data.privateCount,
        });
      }
    } catch (error) {
      console.error("방명록 조회 실패:", error);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleToggleHidden = async (entryId: string, isHidden: boolean) => {
    if (!selectedId) return;

    try {
      const response = await fetch(
        `/api/invitations/${selectedId}/guestbook/${entryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isHidden }),
        }
      );

      if (response.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, isHidden } : e))
        );
        // 통계 재계산
        fetchGuestbook(selectedId);
      }
    } catch (error) {
      console.error("방명록 숨김 토글 실패:", error);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!selectedId) return;

    setDeletingId(entryId);
    try {
      const response = await fetch(
        `/api/invitations/${selectedId}/guestbook/${entryId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
        fetchGuestbook(selectedId);
      }
    } catch (error) {
      console.error("방명록 삭제 실패:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoadingInvitations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">방명록 관리</h1>
          <p className="text-sm text-stone-500 mt-1">
            하객들의 축하 메시지를 확인하고 관리합니다
          </p>
        </div>

        <div className="border border-stone-200 bg-white rounded-lg p-12 text-center">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-stone-900 mb-2">
            청첩장이 없습니다
          </h3>
          <p className="text-sm text-stone-500">먼저 청첩장을 만들어주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-stone-900">방명록 관리</h1>
        <p className="text-sm text-stone-500 mt-1">
          하객들의 축하 메시지를 확인하고 관리합니다
        </p>
      </div>

      {/* 청첩장 선택 */}
      {invitations.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            청첩장 선택
          </label>
          <select
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="w-full max-w-xs px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          >
            <option value="">청첩장을 선택하세요</option>
            {invitations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.groomName} ♥ {inv.brideName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 방명록 내용 */}
      {selectedId && (
        <>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : (
            <>
              {/* 통계 카드 */}
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <StatsCard
                    label="전체"
                    value={stats.total}
                    icon={BookOpen}
                  />
                  <StatsCard
                    label="비공개"
                    value={stats.privateCount}
                    icon={Lock}
                  />
                  <StatsCard
                    label="숨김"
                    value={stats.hiddenCount}
                    icon={EyeOff}
                  />
                </div>
              )}

              {/* 방명록 테이블 */}
              <GuestbookTable
                entries={entries}
                onToggleHidden={handleToggleHidden}
                onDelete={handleDelete}
                isDeleting={deletingId}
              />
            </>
          )}
        </>
      )}

      {/* 청첩장 미선택 시 */}
      {!selectedId && invitations.length > 1 && (
        <div className="border border-stone-200 bg-white rounded-lg p-12 text-center">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <p className="text-sm text-stone-500">
            청첩장을 선택하면 방명록을 확인할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
