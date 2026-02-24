'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Play, Square, Volume2 } from 'lucide-react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import type { ExtendedData } from '@/schemas/invitation';
import { BGM_CONFIG } from '@/lib/bgm/constants';

interface BgmData {
  url?: string;
  title?: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
}

/**
 * BGM 탭
 *
 * - 오디오 파일 업로드 (MP3/M4A, 최대 10MB)
 * - 미리듣기
 * - 볼륨/자동재생/반복 설정
 */
export function BgmTab() {
  const { invitation, updateInvitation, toggleSection, getEnabledSections } = useInvitationEditor();
  const enabledSections = getEnabledSections();
  const enabled = enabledSections.bgm === true;

  const extendedData = (invitation.extendedData as Record<string, unknown>) || {};
  const bgm = (extendedData.bgm as BgmData) || {};

  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateBgm = useCallback(
    (patch: Partial<BgmData>) => {
      const current = ((invitation.extendedData as Record<string, unknown>) || {}).bgm as BgmData | undefined;
      updateInvitation({
        extendedData: {
          ...extendedData,
          bgm: { ...current, ...patch },
        } as ExtendedData,
      });
    },
    [invitation.extendedData, extendedData, updateInvitation],
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!invitation.id) return;

      // 클라이언트 사전 검증
      if (!(BGM_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
        alert('MP3 또는 M4A 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > BGM_CONFIG.MAX_FILE_SIZE) {
        alert(`파일 크기가 10MB를 초과합니다. (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('invitationId', invitation.id);

        const res = await fetch('/api/upload/bgm', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          updateBgm({
            url: data.url,
            title: data.title || file.name.replace(/\.[^.]+$/, ''),
          });
        } else {
          alert(data.error || 'BGM 업로드에 실패했습니다.');
        }
      } catch {
        alert('BGM 업로드 중 오류가 발생했습니다.');
      } finally {
        setUploading(false);
      }
    },
    [invitation.id, updateBgm],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
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

  const removeBgm = useCallback(() => {
    // 미리듣기 중이면 정지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPreviewing(false);
    }
    updateBgm({ url: undefined, title: undefined });
  }, [updateBgm]);

  const togglePreview = useCallback(() => {
    if (!bgm.url) return;

    if (previewing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPreviewing(false);
    } else {
      const audio = new Audio(bgm.url);
      audio.volume = bgm.volume ?? 0.5;
      audio.onended = () => {
        setPreviewing(false);
        audioRef.current = null;
      };
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPreviewing(true);
    }
  }, [bgm.url, bgm.volume, previewing]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1 flex items-center gap-2">
            배경음악
            <span
              className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'
              }`}
            >
              {enabled ? '활성' : '비활성'}
            </span>
          </h2>
          <p className="text-sm text-stone-500">청첩장에 배경음악을 추가하세요</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggleSection('bgm', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500" />
        </label>
      </div>

      {/* 파일 업로드 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <label className="block text-sm font-medium text-stone-600 mb-2">
          음악 파일
        </label>

        {bgm.url ? (
          <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <button
              onClick={togglePreview}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center hover:bg-pink-100 transition-colors"
            >
              {previewing ? (
                <Square className="w-3.5 h-3.5 text-pink-600" />
              ) : (
                <Play className="w-3.5 h-3.5 text-pink-600 ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">
                {bgm.title || '배경음악'}
              </p>
              <p className="text-xs text-stone-400">
                {previewing ? '재생 중...' : 'MP3/M4A'}
              </p>
            </div>
            <button
              onClick={removeBgm}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-stone-500" />
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
              accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a"
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
                <p className="text-sm text-stone-500">클릭하거나 파일을 드래그하세요</p>
                <p className="text-xs text-stone-400">MP3, M4A (최대 10MB)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 재생 설정 */}
      <div className="bg-white rounded-xl p-6 space-y-5 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700">재생 설정</h3>

        {/* 볼륨 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <Volume2 className="w-4 h-4" />
              볼륨
            </label>
            <span className="text-xs text-stone-400 tabular-nums">
              {Math.round((bgm.volume ?? 0.5) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={bgm.volume ?? 0.5}
            onChange={(e) => updateBgm({ volume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-pink-500"
          />
        </div>

        {/* 자동재생 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-700">자동 재생</p>
            <p className="text-xs text-stone-400 mt-0.5">청첩장 열면 자동으로 재생됩니다</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={bgm.autoplay ?? true}
              onChange={(e) => updateBgm({ autoplay: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500" />
          </label>
        </div>

        {/* 반복 재생 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-700">반복 재생</p>
            <p className="text-xs text-stone-400 mt-0.5">음악이 끝나면 다시 재생됩니다</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={bgm.loop ?? true}
              onChange={(e) => updateBgm({ loop: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500" />
          </label>
        </div>
      </div>
    </div>
  );
}
