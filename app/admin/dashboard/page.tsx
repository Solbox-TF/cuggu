import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">대시보드</h1>

          {/* 사용자 정보 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">사용자 정보</h2>
            <div className="space-y-2">
              {session.user.image && (
                <div className="mb-4">
                  <img
                    src={session.user.image}
                    alt="프로필"
                    className="w-16 h-16 rounded-full"
                  />
                </div>
              )}
              <p className="text-gray-700">
                <span className="font-medium">이름:</span>{" "}
                {session.user.name || "없음"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">이메일:</span>{" "}
                {session.user.email || "없음"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">ID:</span> {session.user.id}
              </p>
            </div>
          </div>

          {/* 로그아웃 */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>

        {/* 디버깅: 전체 세션 정보 */}
        <div className="mt-8 bg-gray-900 text-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">세션 정보 (디버깅)</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
