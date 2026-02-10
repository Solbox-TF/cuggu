import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isRegistrationEnabled } from "@/lib/settings";

export const authConfig = {
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  providers: [
    // 카카오 로그인
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      checks: ["state"], // PKCE 비활성화 (카카오 호환성)
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.kakao_account?.profile?.nickname || null,
          email: profile.kakao_account?.email || null,
          image: profile.kakao_account?.profile?.profile_image_url || null,
        };
      },
    }),
    // 네이버 로그인
    Naver({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.response.id,
          name: profile.response.name || profile.response.nickname || null,
          email: profile.response.email || null,
          image: profile.response.profile_image || null,
        };
      },
    }),
    // Credentials 프로바이더 제거됨 — 비밀번호 검증 미구현 상태로 보안 취약점.
    // 이메일 로그인 필요 시 bcrypt 검증 구현 후 재활성화할 것.
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  cookies: {
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async signIn({ account }) {
      if (!account?.provider) return true;

      // 기존 계정이면 항상 통과
      const existing = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.provider, account.provider),
          eq(accounts.providerAccountId, account.providerAccountId),
        ),
      });
      if (existing) return true;

      // 신규 유저 → 가입 허용 여부 확인
      const allowed = await isRegistrationEnabled();
      if (!allowed) {
        return "/login?error=RegistrationClosed";
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // 최초 로그인 시 또는 업데이트 시 role 조회
      if (user || trigger === "update") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub!),
          columns: { role: true },
        });
        token.role = dbUser?.role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as "USER" | "ADMIN") || "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
