'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface BgmOptions {
  url: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
}

/**
 * BGM 재생 훅
 *
 * - autoplay: 첫 사용자 인터랙션(touch/click/scroll) 후 재생 시도
 * - visibilitychange: 탭 숨김 시 pause, 복귀 시 resume
 */
export function useBgmPlayer({ url, autoplay = true, loop = true, volume = 0.5 }: BgmOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // 유저가 명시적으로 정지한 경우 autoplay/visibility resume 방지
  const userPausedRef = useRef(false);

  // Audio 인스턴스 생성 및 설정
  useEffect(() => {
    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [url, loop, volume]);

  // 볼륨/루프 실시간 반영
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
    }
  }, [volume, loop]);

  // 자동재생: 첫 인터랙션 감지
  useEffect(() => {
    if (!autoplay) return;

    const audio = audioRef.current;
    if (!audio) return;

    let triggered = false;

    const tryPlay = () => {
      if (triggered || userPausedRef.current) return;
      triggered = true;
      audio.play().catch(() => {
        // 브라우저가 여전히 차단하면 무시
        triggered = false;
      });
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('scroll', tryPlay);
    };

    window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('scroll', tryPlay, { once: true, passive: true });

    return cleanup;
  }, [autoplay]);

  // visibilitychange: 탭 전환 시 pause/resume
  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        if (!audio.paused) {
          audio.pause();
        }
      } else {
        if (!userPausedRef.current && audio.paused && audio.src) {
          audio.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      userPausedRef.current = false;
      audio.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      audio.pause();
    }
  }, []);

  return { isPlaying, toggle };
}
