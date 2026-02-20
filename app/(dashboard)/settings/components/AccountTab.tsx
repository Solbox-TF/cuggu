"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  premiumPlan: string;
  aiCredits: number;
  emailNotifications: boolean;
  createdAt: string;
  isPremium: boolean;
}

interface AccountTabProps {
  user: UserProfile;
  isSaving: boolean;
  onToggleNotifications: () => void;
}

export function AccountTab({ user, isSaving, onToggleNotifications }: AccountTabProps) {
  return (
    <div className="space-y-8">
      {/* 계정 정보 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">계정 정보</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-medium text-stone-700">이메일</p>
              <p className="text-sm text-stone-500 mt-1">{user.email}</p>
            </div>
          </div>

          {user.name && (
            <div className="flex items-center justify-between py-3 border-b border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-700">이름</p>
                <p className="text-sm text-stone-500 mt-1">{user.name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-medium text-stone-700">가입일</p>
              <p className="text-sm text-stone-500 mt-1">
                {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-stone-700">플랜</p>
              <p className="text-sm text-stone-500 mt-1">
                {user.isPremium ? (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                    <Sparkles className="w-4 h-4" />
                    프리미엄
                  </span>
                ) : (
                  "무료"
                )}
              </p>
            </div>
            {!user.isPremium && (
              <button className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors">
                프리미엄 업그레이드
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 알림 설정 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">알림 설정</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-medium text-stone-900">이메일 알림</p>
              <p className="text-sm text-stone-500 mt-1">
                RSVP 응답 시 이메일로 알림을 받습니다
              </p>
            </div>
            <button
              onClick={onToggleNotifications}
              disabled={isSaving}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200
                ${user.emailNotifications ? "bg-rose-600" : "bg-stone-300"}
                ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                animate={{ x: user.emailNotifications ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 opacity-50 cursor-not-allowed">
            <div>
              <p className="text-sm font-medium text-stone-900">카카오톡 알림</p>
              <p className="text-sm text-stone-500 mt-1">
                곧 제공 예정입니다
              </p>
            </div>
            <div className="w-12 h-6 rounded-full bg-stone-200" />
          </div>
        </div>
      </section>

      {/* 계정 관리 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">계정 관리</h2>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-stone-900">비밀번호 변경</p>
              <p className="text-xs text-stone-500 mt-1">
                보안을 위해 주기적으로 변경해주세요
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-red-600">계정 삭제</p>
              <p className="text-xs text-red-500 mt-1">
                모든 데이터가 영구적으로 삭제됩니다
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </section>
    </div>
  );
}
