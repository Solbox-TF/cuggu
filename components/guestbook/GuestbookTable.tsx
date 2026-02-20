"use client";

import { Trash2, Eye, EyeOff, Lock } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { GuestbookEntryOwner } from "@/schemas/guestbook";

interface GuestbookTableProps {
  entries: GuestbookEntryOwner[];
  onToggleHidden: (entryId: string, isHidden: boolean) => void;
  onDelete: (entryId: string) => void;
  isDeleting?: string | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function GuestbookTable({
  entries,
  onToggleHidden,
  onDelete,
  isDeleting,
}: GuestbookTableProps) {
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const handleDeleteClick = async (entry: GuestbookEntryOwner) => {
    const confirmed = await confirm({
      title: "방명록 삭제",
      description: `${entry.name}님의 메시지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: "삭제",
      cancelText: "취소",
      variant: "danger",
    });

    if (confirmed) {
      onDelete(entry.id);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="border border-stone-200 bg-white rounded-lg p-12 text-center">
        <p className="text-stone-500">아직 방명록이 없습니다</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-stone-200 bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600">이름</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">메시지</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">상태</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">작성일</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-stone-50 ${entry.isHidden ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-stone-900 whitespace-nowrap">
                    {entry.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600 max-w-[300px] truncate">
                    {entry.message}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {entry.isPrivate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Lock className="w-3 h-3" />
                          비공개
                        </span>
                      )}
                      {entry.isHidden && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-600">
                          숨김
                        </span>
                      )}
                      {!entry.isPrivate && !entry.isHidden && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          공개
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-stone-500 whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => onToggleHidden(entry.id, !entry.isHidden)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
                        title={entry.isHidden ? "표시" : "숨기기"}
                      >
                        {entry.isHidden ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(entry)}
                        disabled={isDeleting === entry.id}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        {...options}
      />
    </>
  );
}
