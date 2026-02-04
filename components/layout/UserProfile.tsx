"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-3 bg-gray-200 rounded-lg w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const displayName = user.name || "사용자";
  const displayEmail = user.email || "";

  return (
    <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {user.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={44}
            height={44}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-white">
            {displayName.charAt(0)}
          </div>
        )}

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate font-medium">{displayEmail}</p>
        </div>
      </div>
    </div>
  );
}
