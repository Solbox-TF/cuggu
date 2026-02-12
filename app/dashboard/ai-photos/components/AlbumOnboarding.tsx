'use client';

import { useState } from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';

interface AlbumOnboardingProps {
  onAlbumCreated: (albumId: string) => void;
}

export function AlbumOnboarding({ onAlbumCreated }: AlbumOnboardingProps) {
  const [albumName, setAlbumName] = useState('나의 웨딩 앨범');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = albumName.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: albumName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.albumId) {
          onAlbumCreated(data.albumId);
          return;
        }
        throw new Error(data.error || '앨범 생성 실패');
      }

      onAlbumCreated(data.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '앨범 생성 중 오류가 발생했습니다');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50">
          <Camera className="w-7 h-7 text-rose-500" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900">AI 웨딩 앨범 만들기</h2>
        <p className="text-sm text-stone-500">
          앨범을 만들고, 대시보드에서 사진을 생성해보세요
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">앨범 이름</label>
        <input
          type="text"
          value={albumName}
          onChange={(e) => setAlbumName(e.target.value)}
          disabled={creating}
          placeholder="나의 웨딩 앨범"
          className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      <button
        onClick={handleCreate}
        disabled={!canCreate || creating}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {creating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            앨범 생성 중...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            앨범 만들기
          </>
        )}
      </button>
    </div>
  );
}
