'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import type { ExtendedData } from '@/schemas/invitation';

/**
 * 엔딩 탭
 *
 * - 마무리 이미지 (단일)
 * - 마무리 문구
 * - 예시 문구 제공
 */
export function EndingTab() {
  const { invitation, updateInvitation, toggleSection, getEnabledSections } = useInvitationEditor();
  const enabledSections = getEnabledSections();
  const enabled = enabledSections.ending === true;

  const extendedData = (invitation.extendedData as Record<string, unknown>) || {};
  const ending = (extendedData.ending as { imageUrl?: string; message?: string }) || {};

  const [uploading, setUploading] = useState(false);

  const updateEnding = useCallback(
    (patch: { imageUrl?: string; message?: string }) => {
      const current = ((invitation.extendedData as Record<string, unknown>) || {}).ending as
        | { imageUrl?: string; message?: string }
        | undefined;
      updateInvitation({
        extendedData: {
          ...extendedData,
          ending: { ...current, ...patch },
        } as ExtendedData,
      });
    },
    [invitation.extendedData, extendedData, updateInvitation],
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!invitation.id) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('invitationId', invitation.id);

        const res = await fetch('/api/upload/ending', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          updateEnding({ imageUrl: data.url });
        }
      } finally {
        setUploading(false);
      }
    },
    [invitation.id, updateEnding],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = '';
    },
    [handleFileUpload],
  );

  const removeImage = useCallback(() => {
    updateEnding({ imageUrl: undefined });
  }, [updateEnding]);

  const exampleMessages = [
    '오늘 이 자리에 함께해 주셔서 감사합니다.\n여러분의 축복 속에 아름다운 시작을 하겠습니다.',
    '함께해 주신 모든 분들께 감사드리며,\n늘 행복한 모습으로 인사드리겠습니다.',
    '소중한 걸음 해주신 여러분께\n깊은 감사의 마음을 전합니다.',
    '사랑하는 사람들과 함께하는 이 순간,\n평생 잊지 못할 추억이 될 것입니다.',
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1 flex items-center gap-2">
            엔딩
            <span
              className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'
              }`}
            >
              {enabled ? '활성' : '비활성'}
            </span>
          </h2>
          <p className="text-sm text-stone-500">청첩장 마무리 사진과 인사를 설정하세요</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggleSection('ending', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500" />
        </label>
      </div>

      {/* 마무리 이미지 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <label className="block text-sm font-medium text-stone-600 mb-2">
          마무리 이미지
        </label>

        {ending.imageUrl ? (
          <div className="relative rounded-lg overflow-hidden">
            <Image
              src={ending.imageUrl}
              alt="엔딩 이미지 미리보기"
              width={600}
              height={300}
              className="w-full h-48 md:h-64 object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative border-2 border-dashed border-stone-200 rounded-lg p-8 text-center hover:border-pink-300 hover:bg-pink-50/30 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                <p className="text-sm text-stone-500">업로드 중...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-stone-300" />
                <p className="text-sm text-stone-500">클릭하거나 이미지를 드래그하세요</p>
                <p className="text-xs text-stone-400">JPG, PNG, WebP (최대 10MB)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 마무리 문구 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            마무리 문구
          </label>
          <textarea
            value={ending.message || ''}
            onChange={(e) => updateEnding({ message: e.target.value })}
            placeholder="마무리 인사를 입력하세요"
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors resize-none placeholder:text-stone-400"
          />
          <p className="text-xs text-stone-500 mt-1.5">
            {ending.message?.length || 0} / 500자
          </p>
        </div>
      </div>

      {/* 예시 문구 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">예시 마무리 문구</h3>
        <div className="space-y-2.5">
          {exampleMessages.map((msg, index) => (
            <button
              key={index}
              onClick={() => updateEnding({ message: msg })}
              className="w-full p-3.5 text-left border border-stone-200 rounded-lg hover:border-pink-300 hover:bg-pink-50/50 transition-colors"
            >
              <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">
                {msg}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
