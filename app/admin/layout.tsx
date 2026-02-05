import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  console.log("[Admin] session:", session?.user?.email);

  if (!session?.user?.email) {
    console.log("[Admin] No session, redirecting");
    redirect("/dashboard");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { id: true, role: true },
  });

  console.log("[Admin] user from DB:", user);

  if (!user || user.role !== "ADMIN") {
    console.log("[Admin] Not admin, redirecting");
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-stone-50">
      <AdminNav />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
