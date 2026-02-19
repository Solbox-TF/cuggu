'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Check,
  Loader2,
  Upload,
  ImageIcon,
  Sparkles,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { GALLERY_CONFIG } from '@/lib/ai/constants';
import type { AlbumImage } from '@/types/ai';

// ── Types ──

interface Album {
  id: string;
  name: string;
  snapType: string | null;
  images: AlbumImage[];
  status: string;
}

type ModalTab = 'album' | 'device';
type AlbumStep = 'list' | 'photos';

interface AddPhotosModalProps {
  isOpen: boolean;
  invitationId: string | undefined;
  existingUrls: string[];
  remainingCapacity: number;
  onClose: () => void;
  onPhotosAdded: (urls: string[]) => void;
}

// ── Component ──

export function AddPhotosModal({
  isOpen,
  invitationId,
  existingUrls,
  remainingCapacity,
  onClose,
  onPhotosAdded,
}: AddPhotosModalProps) {
  // 공통
  const [activeTab, setActiveTab] = useState<ModalTab>('album');

  // 앨범 탭
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumStep, setAlbumStep] = useState<AlbumStep>('list');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedAlbumUrls, setSelectedAlbumUrls] = useState<Set<string>>(
    new Set()
  );

  // 기기 탭
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingSet = new Set(existingUrls);

  // 앨범 fetch
  const fetchAlbums = useCallback(async () => {
    setAlbumsLoading(true);
    try {
      const res = await fetch('/api/ai/albums');
      const data = await res.json();
      if (data.success) {
        setAlbums(data.data);
        // 앨범이 1개면 자동으로 사진 그리드
        if (data.data.length === 1) {
          setSelectedAlbumId(data.data[0].id);
          setAlbumStep('photos');
        }
      }
    } catch {
      // ignore
    } finally {
      setAlbumsLoading(false);
    }
  }, []);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab('album');
      setAlbumStep('list');
      setSelectedAlbumId(null);
      setSelectedAlbumUrls(new Set());
      setUploadedUrls([]);
      setUploadError(null);
      fetchAlbums();
    }
  }, [isOpen, fetchAlbums]);

  // 현재 선택된 앨범
  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  // 앨범 선택 핸들러
  const handleAlbumSelect = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setSelectedAlbumUrls(new Set());
    setAlbumStep('photos');
  };

  // 사진 토글
  const handleTogglePhoto = (url: string) => {
    if (existingSet.has(url)) return;
    setSelectedAlbumUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        if (next.size >= remainingCapacity) return prev;
        next.add(url);
      }
      return next;
    });
  };

  // 기기 업로드
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadError(null);

    if (!invitationId) {
      setUploadError('청첩장을 먼저 저장해주세요');
      e.target.value = '';
      return;
    }

    if (files.length > GALLERY_CONFIG.MAX_BATCH) {
      setUploadError(
        `한 번에 최대 ${GALLERY_CONFIG.MAX_BATCH}장까지 업로드 가능합니다`
      );
      e.target.value = '';
      return;
    }

    const oversized = files.filter(
      (f) => f.size > GALLERY_CONFIG.MAX_FILE_SIZE
    );
    if (oversized.length) {
      setUploadError(
        `${oversized.map((f) => f.name).join(', ')} 파일이 10MB를 초과합니다`
      );
      e.target.value = '';
      return;
    }

    const maxUpload = remainingCapacity - uploadedUrls.length;
    if (maxUpload <= 0) {
      setUploadError(`갤러리 한도에 도달했습니다`);
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.slice(0, maxUpload).forEach((f) => formData.append('files', f));
      formData.append('invitationId', invitationId);

      const res = await fetch('/api/upload/gallery', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || '업로드 실패');
      }

      setUploadedUrls((prev) => [...prev, ...json.data.urls]);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 확인 버튼
  const handleConfirm = () => {
    if (activeTab === 'album') {
      onPhotosAdded([...selectedAlbumUrls]);
    } else {
      onPhotosAdded(uploadedUrls);
    }
  };

  const confirmCount =
    activeTab === 'album' ? selectedAlbumUrls.size : uploadedUrls.length;
  const canConfirm = confirmCount > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full sm:max-w-lg max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-semibold text-stone-900">
            사진 추가하기
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab('album')}
            className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
              activeTab === 'album'
                ? 'text-pink-600 border-b-2 border-pink-500'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            앨범에서
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
              activeTab === 'device'
                ? 'text-pink-600 border-b-2 border-pink-500'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            내 기기에서
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'album' ? (
            <AlbumTabContent
              albums={albums}
              loading={albumsLoading}
              step={albumStep}
              selectedAlbum={selectedAlbum ?? null}
              selectedUrls={selectedAlbumUrls}
              existingSet={existingSet}
              remainingCapacity={remainingCapacity}
              onAlbumSelect={handleAlbumSelect}
              onTogglePhoto={handleTogglePhoto}
              onBackToList={() => {
                setAlbumStep('list');
                setSelectedAlbumId(null);
                setSelectedAlbumUrls(new Set());
              }}
            />
          ) : (
            <DeviceTabContent
              invitationId={invitationId}
              uploading={uploading}
              uploadedUrls={uploadedUrls}
              error={uploadError}
              remainingCapacity={remainingCapacity - uploadedUrls.length}
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
            />
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 bg-stone-50">
          <span className="text-xs text-stone-500">
            남은 슬롯: {remainingCapacity - (activeTab === 'device' ? uploadedUrls.length : 0)}장
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 disabled:bg-stone-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {confirmCount > 0 ? `${confirmCount}장 추가` : '추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Album Tab ──

function AlbumTabContent({
  albums,
  loading,
  step,
  selectedAlbum,
  selectedUrls,
  existingSet,
  remainingCapacity,
  onAlbumSelect,
  onTogglePhoto,
  onBackToList,
}: {
  albums: Album[];
  loading: boolean;
  step: AlbumStep;
  selectedAlbum: Album | null;
  selectedUrls: Set<string>;
  existingSet: Set<string>;
  remainingCapacity: number;
  onAlbumSelect: (id: string) => void;
  onTogglePhoto: (url: string) => void;
  onBackToList: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        <p className="text-sm text-stone-500">앨범 불러오는 중...</p>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-stone-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-700">
            아직 앨범이 없어요
          </p>
          <p className="text-xs text-stone-500 mt-1">
            AI 포토 스튜디오에서 먼저 사진을 만들어보세요
          </p>
        </div>
        <a
          href="/ai-photos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 mt-1"
        >
          <Sparkles className="w-4 h-4" />
          AI 포토 스튜디오 열기
        </a>
      </div>
    );
  }

  // 앨범 목록
  if (step === 'list') {
    return (
      <div className="space-y-2">
        {albums.map((album) => {
          const imageCount = (album.images ?? []).length;
          const thumbUrl = album.images?.[0]?.url;
          return (
            <button
              key={album.id}
              onClick={() => onAlbumSelect(album.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-pink-200 hover:bg-pink-50/30 transition-colors text-left"
            >
              <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-stone-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {album.name}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {imageCount > 0 ? `사진 ${imageCount}장` : '사진 없음'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 사진 그리드
  if (!selectedAlbum) return null;
  const images = selectedAlbum.images ?? [];

  return (
    <div className="space-y-3">
      {/* 뒤로가기 (앨범 2개 이상) */}
      {albums.length > 1 && (
        <button
          onClick={onBackToList}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          앨범 목록
        </button>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-800">
          {selectedAlbum.name}
        </p>
        <span className="text-xs text-stone-500">
          {selectedUrls.size}장 선택
          {remainingCapacity > 0 && ` / 최대 ${remainingCapacity}장`}
        </span>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-stone-500">이 앨범에 사진이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => {
            const isExisting = existingSet.has(img.url);
            const isSelected = selectedUrls.has(img.url);
            const isDisabled =
              isExisting ||
              (!isSelected && selectedUrls.size >= remainingCapacity);

            return (
              <button
                key={img.url}
                onClick={() => onTogglePhoto(img.url)}
                disabled={isDisabled}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  isExisting
                    ? 'border-stone-200 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-pink-500 ring-2 ring-pink-500/20'
                    : isDisabled
                    ? 'border-stone-200 opacity-40 cursor-not-allowed'
                    : 'border-transparent hover:border-stone-300'
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {isExisting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-[10px] font-medium text-white bg-black/50 px-2 py-0.5 rounded-full">
                      추가됨
                    </span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20">
                    <div className="rounded-full bg-pink-500 p-1">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Device Tab ──

function DeviceTabContent({
  invitationId,
  uploading,
  uploadedUrls,
  error,
  remainingCapacity,
  fileInputRef,
  onFileUpload,
}: {
  invitationId: string | undefined;
  uploading: boolean;
  uploadedUrls: string[];
  error: string | null;
  remainingCapacity: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  if (!invitationId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <AlertCircle className="w-6 h-6 text-amber-500" />
        <p className="text-sm text-stone-700">
          사진을 업로드하려면 먼저 청첩장을 저장해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 드래그-드롭 / 파일 선택 */}
      <label
        className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl transition-colors cursor-pointer group ${
          uploading
            ? 'border-stone-300 bg-stone-50 cursor-wait'
            : remainingCapacity <= 0
            ? 'border-stone-200 bg-stone-50 cursor-not-allowed'
            : 'border-stone-300 hover:border-pink-300 hover:bg-pink-50/30'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-stone-500 animate-spin" />
            <p className="text-sm text-stone-600 font-medium">업로드 중...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-stone-400 group-hover:text-pink-400 transition-colors" />
            <p className="text-sm text-stone-700 font-medium">
              클릭하여 사진 선택
            </p>
            <p className="text-xs text-stone-500">
              최대 10MB/장 ・ JPG, PNG, WebP
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileUpload}
          disabled={uploading || remainingCapacity <= 0}
          className="hidden"
        />
      </label>

      {/* 업로드된 사진 미리보기 */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-stone-500">
            업로드 완료 ({uploadedUrls.length}장)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {uploadedUrls.map((url) => (
              <div
                key={url}
                className="aspect-square rounded-lg overflow-hidden border border-stone-200"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
