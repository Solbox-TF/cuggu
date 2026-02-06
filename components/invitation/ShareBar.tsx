'use client';

import { useCallback } from 'react';
import { Link, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ShareBarProps {
  invitationId: string;
  groomName: string;
  brideName: string;
}

function copyToClipboard(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return ok;
}

export function ShareBar({ invitationId, groomName, brideName }: ShareBarProps) {
  const { showToast } = useToast();

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/inv/${invitationId}`
    : `/inv/${invitationId}`;

  const shareTitle = `${groomName} ♥ ${brideName} 결혼합니다`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사되었습니다!');
    } catch {
      const ok = copyToClipboard(shareUrl);
      if (ok) {
        showToast('링크가 복사되었습니다!');
      } else {
        showToast('복사에 실패했습니다', 'error');
      }
    }
  }, [shareUrl, showToast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }, [shareUrl, shareTitle, handleCopy]);

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
    >
      <div className="flex gap-2.5 justify-center px-5 pb-3 pointer-events-auto max-w-sm mx-auto">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 py-2.5 px-5 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/60 text-stone-600 text-[13px] tracking-wide font-medium shadow-lg shadow-black/[0.06] active:scale-[0.96] transition-all"
        >
          <Link className="w-3.5 h-3.5" />
          링크 복사
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 py-2.5 px-5 rounded-full bg-stone-800/85 backdrop-blur-md text-white/95 text-[13px] tracking-wide font-medium shadow-lg shadow-black/[0.12] active:scale-[0.96] transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          공유하기
        </button>
      </div>
    </div>
  );
}
