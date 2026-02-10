'use client';

import { useState, useEffect } from 'react';

/**
 * SSR-safe media query hook
 * 서버에서는 undefined 반환 → 클라이언트 마운트 후 실제 값 반영
 */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * 반응형 브레이크포인트 훅
 *
 * - mobile: < 768px
 * - tablet: 768px ~ 1023px
 * - desktop: >= 1024px
 *
 * SSR 시 desktop 기본값 반환
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isSSR = isMobile === undefined;

  return {
    isMobile: isMobile ?? false,
    isTablet: isTablet ?? false,
    isDesktop: isDesktop ?? true,
    isSSR,
  };
}
