"use client";

export function UserProfile() {
  // TODO: 실제 사용자 데이터는 NextAuth session에서 가져오기
  const user = {
    name: "홍길동",
    email: "user@example.com",
    avatar: null,
  };

  return (
    <div className="px-3 py-4 mb-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold">
          {user.name.charAt(0)}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
        </div>
      </div>
    </div>
  );
}
