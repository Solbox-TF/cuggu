'use client';

import { useInvitationView } from '@/stores/invitation-view';

export function FloatingBadge() {
  const isCtaVisible = useInvitationView((s) => s.isCtaVisible);

  return (
    <a
      href="https://cuggu.io?ref=floating"
      target="_blank"
      rel="noopener noreferrer"
      data-event="floating_badge_click"
      className={`fixed right-3 bottom-[4.5rem] z-30 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-stone-200/50 shadow-sm text-[11px] font-medium text-stone-400 hover:text-stone-600 hover:bg-white/90 transition-all duration-300 ${isCtaVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <svg
        viewBox="0 0 16 16"
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 1l2 5h5l-4 3.5 1.5 5L8 11.5 3.5 14.5 5 9.5 1 6h5z" />
      </svg>
      Cuggu
    </a>
  );
}
