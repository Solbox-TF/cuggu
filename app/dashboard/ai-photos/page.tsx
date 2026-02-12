'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Gem, Loader2, Plus, Trash2, ChevronLeft, ImageIcon } from 'lucide-react';
import { AlbumImage, AlbumGroup } from '@/types/ai';
import { AlbumOnboarding } from './components/AlbumOnboarding';

const IS_DEV = process.env.NODE_ENV === 'development';

interface Album {
  id: string;
  name: string;
  images: AlbumImage[];
  groups: AlbumGroup[];
}

export default function AIPhotosPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  useEffect(() => {
    fetchAlbums();
    fetchCredits();
  }, []);

  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/albums');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setAlbums(data.data);
        setShowOnboarding(false);
      } else {
        setAlbums([]);
      }
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const res = await fetch('/api/user/credits');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCredits(data.credits);
    } catch {
      // ignore
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const handleAlbumCreated = (albumId: string) => {
    router.push(`/dashboard/ai-photos/${albumId}`);
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('이 앨범을 삭제하시겠습니까?')) return;
    setDeletingAlbumId(albumId);
    try {
      const res = await fetch(`/api/ai/albums/${albumId}`, { method: 'DELETE' });
      if (res.ok) await fetchAlbums();
    } catch {
      // ignore
    } finally {
      setDeletingAlbumId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h1 className="text-lg font-semibold text-stone-900">AI 웨딩 앨범</h1>
          </div>
          <p className="text-sm text-stone-500">
            AI로 특별한 웨딩 화보를 만들어보세요
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
          <Gem className="w-3 h-3" />
          {isLoadingCredits ? '...' : IS_DEV ? '∞ DEV' : `${credits} 크레딧`}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          <p className="text-sm text-stone-500">로딩 중...</p>
        </div>
      ) : albums.length === 0 || showOnboarding ? (
        <div className="space-y-4">
          {albums.length > 0 && (
            <button
              onClick={() => setShowOnboarding(false)}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
            >
              <ChevronLeft className="w-4 h-4" />
              앨범 리스트로 돌아가기
            </button>
          )}
          <AlbumOnboarding onAlbumCreated={handleAlbumCreated} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((a) => {
            const imageCount = (a.images ?? []).length;
            const thumbUrl = a.images?.[0]?.url;
            return (
              <button
                key={a.id}
                onClick={() => router.push(`/dashboard/ai-photos/${a.id}`)}
                className="group relative flex flex-col rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-rose-200 hover:shadow-md"
              >
                <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-stone-50 overflow-hidden">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={a.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-stone-300" />
                  )}
                </div>
                <span className="text-sm font-medium text-stone-900">{a.name}</span>
                <span className="text-xs text-stone-500 mt-0.5">
                  {imageCount > 0 ? `사진 ${imageCount}장` : '사진 없음'}
                </span>
                {albums.length > 1 && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAlbum(a.id);
                    }}
                    className="absolute top-3 right-3 rounded-md p-1 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100 hover:text-red-500"
                  >
                    {deletingAlbumId === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 p-4 text-stone-500 transition-colors hover:border-rose-300 hover:text-rose-600 min-h-[180px]"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">새 앨범 만들기</span>
          </button>
        </div>
      )}
    </div>
  );
}
