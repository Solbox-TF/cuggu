'use client';

import { useInvitationView } from '@/stores/invitation-view';

/**
 * 개발 모드 전용 Premium 상태 토글.
 * NODE_ENV === 'development'에서만 렌더링.
 */
export function PremiumToggle() {
  const { isPremium, setIsPremium } = useInvitationView();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <button
      onClick={() => setIsPremium(!isPremium)}
      className="fixed top-16 left-2 z-[9999] px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border shadow-sm backdrop-blur-sm transition-colors"
      style={{
        background: isPremium ? 'rgba(234,179,8,0.15)' : 'rgba(156,163,175,0.15)',
        borderColor: isPremium ? 'rgb(234,179,8)' : 'rgb(156,163,175)',
        color: isPremium ? 'rgb(161,98,7)' : 'rgb(75,85,99)',
      }}
    >
      {isPremium ? 'PREMIUM' : 'FREE'}
    </button>
  );
}
