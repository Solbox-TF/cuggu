"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (credits: number) => void;
  isLoading?: boolean;
}

export function UserActionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: UserActionModalProps) {
  const [credits, setCredits] = useState(5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(credits);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-stone-100 rounded"
        >
          <X className="w-4 h-4 text-stone-400" />
        </button>

        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          크레딧 부여
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            부여할 크레딧 수
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
          <p className="mt-1 text-xs text-stone-500">1~100 사이 값</p>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {isLoading ? "처리 중..." : "부여하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
