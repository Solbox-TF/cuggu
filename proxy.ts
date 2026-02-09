import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export default auth(async (req) => {
  const { nextUrl } = req;

  // API 공개 엔드포인트 rate limiting
  if (
    nextUrl.pathname.startsWith("/api/invitations/") &&
    (nextUrl.pathname.endsWith("/verify") ||
      nextUrl.pathname.endsWith("/rsvp"))
  ) {
    const ip = getClientIp(req);
    const { allowed } = await rateLimit(`ratelimit:api:${ip}`, 30, 60); // 30 req/min per IP

    if (!allowed) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;

  // 보호된 라우트
  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/editor") ||
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/api/invitations/:path*/verify",
    "/api/invitations/:path*/rsvp",
  ],
};
