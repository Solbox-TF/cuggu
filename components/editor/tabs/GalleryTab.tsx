'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { Plus, AlertCircle, Sparkles } from 'lucide-react';
import { GALLERY_CONFIG } from '@/lib/ai/constants';
import { GalleryImageGrid } from './gallery/GalleryImageGrid';
import { AddPhotosModal } from './gallery/AddPhotosModal';

export function GalleryTab() {
  const { invitation, updateInvitation } = useInvitationEditor();
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const images = invitation.gallery?.images || [];
  const limit = GALLERY_CONFIG.FREE_LIMIT; // TODO: 유저 tier에 따라 동적으로
  const remaining = limit - images.length;

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_: string, i: number) => i !== index);
    updateInvitation({
      gallery: {
        ...invitation.gallery,
        images: updated,
      },
    });
  };

  const handlePhotosAdded = (urls: string[]) => {
    const existing = new Set(images);
    const newUrls = urls.filter((u) => !existing.has(u));
    if (!newUrls.length) return;

    const toAdd = newUrls.slice(0, remaining);
    if (toAdd.length < newUrls.length) {
      setError(`갤러리 한도(${limit}장)로 인해 ${toAdd.length}장만 추가되었습니다`);
    } else {
      setError(null);
    }

    updateInvitation({
      gallery: {
        ...invitation.gallery,
        images: [...images, ...toAdd],
      },
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">
          갤러리
        </h2>
        <p className="text-sm text-stone-500">
          청첩장에 담을 사진을 추가하세요
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 이미지 그리드 */}
      <GalleryImageGrid images={images} onRemove={handleRemoveImage} />

      {/* 사진 추가하기 버튼 */}
      <div className="space-y-3">
        {remaining > 0 ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border-2 border-dashed border-stone-300 hover:border-pink-300 hover:bg-pink-50/30 rounded-xl text-sm font-medium text-stone-600 hover:text-pink-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            사진 추가하기 ({images.length}/{limit})
          </button>
        ) : (
          <div className="text-center py-3 text-sm text-stone-500">
            갤러리 한도에 도달했습니다 ({limit}장)
          </div>
        )}

        {/* AI 포토 스튜디오 링크 */}
        <a
          href="/ai-photos"
          className="flex items-center justify-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          AI 포토 스튜디오 열기
        </a>
      </div>

      {/* 사진 추가 모달 */}
      <AddPhotosModal
        isOpen={showAddModal}
        invitationId={invitation.id ?? undefined}
        existingUrls={images}
        remainingCapacity={remaining}
        onClose={() => setShowAddModal(false)}
        onPhotosAdded={handlePhotosAdded}
      />
    </div>
  );
}
