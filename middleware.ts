import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * 글로벌 인증 미들웨어 (defense-in-depth)
 *
 * 각 라우트 핸들러의 auth() 호출이 1차 방어선,
 * 이 미들웨어가 2차 방어선 역할. 개발자가 auth() 누락해도 보호됨.
 */

const PUBLIC_PAGES = new Set(['/', '/login', '/error']);

const PUBLIC_API_PREFIXES = [
  '/api/auth/', // NextAuth
  '/api/cron/', // Cron (CRON_SECRET 자체 인증)
];

/** /api/invitations/[id]/(rsvp|guestbook|verify) */
const INVITATION_PUBLIC_SUB = /^\/api\/invitations\/[^/]+\/(rsvp|guestbook|verify)$/;
/** /api/invitations/[id] */
const INVITATION_SINGLE = /^\/api\/invitations\/[^/]+$/;

function isPublicRoute(pathname: string, method: string): boolean {
  // 공개 페이지
  if (PUBLIC_PAGES.has(pathname)) return true;
  if (pathname.startsWith('/inv/')) return true;

  // 공개 API prefix
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;

  // 공개 초대장 하위 라우트 (rsvp, guestbook, verify)
  if (INVITATION_PUBLIC_SUB.test(pathname)) return true;

  // GET /api/invitations/[id] — 공개 뷰 데이터
  if (INVITATION_SINGLE.test(pathname) && method === 'GET') return true;

  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname, req.method)) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const isApiRoute = pathname.startsWith('/api/');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  // 미인증
  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin 권한 체크
  if (isAdminRoute && req.auth?.user?.role !== 'ADMIN') {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * _next/static, _next/image, 정적 파일 제외.
     * 나머지 모든 경로에서 미들웨어 실행.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
