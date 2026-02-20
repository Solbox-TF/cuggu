import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export default auth(async (req) => {
  const { nextUrl } = req;

  // ── API rate limiting ──
  if (nextUrl.pathname.startsWith("/api/")) {
    // 공개 엔드포인트: IP 기반 (30 req/min)
    if (
      nextUrl.pathname.startsWith("/api/invitations/") &&
      (nextUrl.pathname.endsWith("/verify") ||
        nextUrl.pathname.endsWith("/rsvp"))
    ) {
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

  const isLoggedIn = !!req.auth;

  // 보호된 라우트
  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/editor") ||
    nextUrl.pathname.startsWith("/m/editor") ||
    nextUrl.pathname.startsWith("/settings");

  // 인증 관련 라우트
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup");

  // 로그인 안 한 사용자가 보호된 라우트 접근 시
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
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
