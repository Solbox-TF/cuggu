import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/** /api/invitations/[id]/(rsvp|guestbook|verify) */
const INVITATION_PUBLIC_SUB =
  /^\/api\/invitations\/[^/]+\/(rsvp|guestbook|verify)$/;
/** /api/invitations/[id] (GET만 공개) */
const INVITATION_SINGLE = /^\/api\/invitations\/[^/]+$/;

function isPublicApi(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (INVITATION_PUBLIC_SUB.test(pathname)) return true;
  if (INVITATION_SINGLE.test(pathname) && method === "GET") return true;
  return false;
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // ── API ──
  if (nextUrl.pathname.startsWith("/api/")) {
    const isPublic = isPublicApi(nextUrl.pathname, req.method);

    // 공개 엔드포인트: IP 기반 rate limit (30 req/min)
    if (isPublic) {
      const ip = getClientIp(req);
      const { allowed } = await rateLimit(`ratelimit:api:${ip}`, 30, 60);

      if (!allowed) {
        return NextResponse.json(
          { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      }

      return NextResponse.next();
    }

    // 비공개 API: 미인증 → 401
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin API: 권한 체크
    if (nextUrl.pathname.startsWith("/api/admin") && req.auth?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 인증된 API: 유저 기반 글로벌 rate limit (60 req/min)
    const userId = req.auth?.user?.id;
    if (userId) {
      const { allowed } = await rateLimit(`ratelimit:global:${userId}`, 60, 60);

      if (!allowed) {
        return NextResponse.json(
          { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      }
    }

    return NextResponse.next();
  }

  // ── 에디터 UA 리다이렉트 ──
  const ua = req.headers.get("user-agent") || "";
  const isMobileUA = MOBILE_UA.test(ua);
  const preferDesktop =
    req.cookies.get("prefer-desktop-editor")?.value === "true";

  // 데스크톱 에디터에 모바일 접속 → /m/editor로
  if (
    nextUrl.pathname.startsWith("/editor/") &&
    isMobileUA &&
    !preferDesktop
  ) {
    const mobileUrl = nextUrl.clone();
    mobileUrl.pathname = nextUrl.pathname.replace("/editor/", "/m/editor/");
    return NextResponse.redirect(mobileUrl);
  }

  // 모바일 에디터에 데스크톱 접속 → /editor로
  if (nextUrl.pathname.startsWith("/m/editor/") && !isMobileUA) {
    const desktopUrl = nextUrl.clone();
    desktopUrl.pathname = nextUrl.pathname.replace("/m/editor/", "/editor/");
    return NextResponse.redirect(desktopUrl);
  }

  // ── 페이지 인증 ──

  // 보호된 라우트
  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/editor") ||
    nextUrl.pathname.startsWith("/m/editor") ||
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/settings");

  // 인증 관련 라우트
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup");

  // 로그인 안 한 사용자가 보호된 라우트 접근 시
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin 페이지: 권한 체크
  if (nextUrl.pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 로그인한 사용자가 로그인 페이지 접근 시
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
