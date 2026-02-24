'use client';

import { Music, Pause } from 'lucide-react';
import { useBgmPlayer } from '@/hooks/useBgmPlayer';

interface BgmData {
  url: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
}

interface BgmPlayerProps {
  bgm: BgmData;
}

/**
 * 플로팅 BGM 플레이어 버튼
 *
 * 위치: 우측 하단, ShareBar 위
 */
export function BgmPlayer({ bgm }: BgmPlayerProps) {
  const { isPlaying, toggle } = useBgmPlayer({
    url: bgm.url,
    autoplay: bgm.autoplay ?? true,
    loop: bgm.loop ?? true,
    volume: bgm.volume ?? 0.5,
  });

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? '배경음악 정지' : '배경음악 재생'}
      className="fixed right-4 z-40 w-10 h-10 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/60 shadow-lg shadow-black/[0.06] flex items-center justify-center active:scale-[0.92] transition-all"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {isPlaying ? (
        <Pause className="w-4 h-4 text-stone-700" />
      ) : (
        <Music className="w-4 h-4 text-stone-400" />
      )}
      {isPlaying && (
        <span className="absolute inset-0 rounded-full border-2 border-pink-300 animate-ping opacity-30 pointer-events-none" />
      )}
    </button>
  );
}
