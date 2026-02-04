"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileHeart, Sparkles, Settings, LogOut, Home } from "lucide-react";
import { UserProfile } from "./UserProfile";
import { motion } from "framer-motion";

const navItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "내 청첩장",
    href: "/dashboard/invitations",
    icon: FileHeart,
  },
  {
    title: "AI 사진 생성",
    href: "/dashboard/ai-photos",
    icon: Sparkles,
  },
  {
    title: "설정",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  // TODO: 실제 데이터는 DB/API에서 가져오기
  const aiCredits = {
    used: 0,
    total: 2,
  };

  const percentage = (aiCredits.used / aiCredits.total) * 100;

  return (
    <aside className="w-72 border-r border-gray-100 bg-white/80 backdrop-blur-sm flex flex-col h-screen">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent group-hover:from-pink-500 group-hover:to-purple-500 transition-all">
            Cuggu
          </span>
        </Link>
      </div>

      {/* User Profile */}
      <UserProfile />

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 font-semibold shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -left-4 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-600 rounded-r-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Icon className={`w-5 h-5 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
              <span className="text-sm">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Credits Card */}
      <div className="p-4 m-4 mb-6 rounded-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border border-pink-100/50 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-semibold text-gray-800">AI 크레딧</span>
            </div>
            <span className="text-sm font-bold text-pink-600">
              {aiCredits.total - aiCredits.used} / {aiCredits.total}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${100 - percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <p className="text-xs text-gray-600 mt-2.5 font-medium">
            {aiCredits.used === aiCredits.total ? "크레딧을 모두 사용했습니다" : `${aiCredits.total - aiCredits.used}회 남음`}
          </p>
        </div>

        <button className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          + 크레딧 구매
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 pb-6">
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all w-full group">
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
