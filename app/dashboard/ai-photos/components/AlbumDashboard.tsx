'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Check,
  X,
  Loader2,
  FolderPlus,
  Tag,
} from 'lucide-react';
import { createId } from '@paralleldrive/cuid2';
import { AIStyle, PersonRole, SnapType, SNAP_TYPES, AlbumImage, AlbumGroup, AI_STYLES, PRESET_TAGS } from '@/types/ai';
import { StyleSelector } from './StyleSelector';
import { AIPhotoUploader } from './AIPhotoUploader';
import { AIStreamingGallery } from '@/components/ai/AIStreamingGallery';
import { AIResultGallery } from '@/components/ai/AIResultGallery';
import { AlbumCuration } from './AlbumCuration';
import { GenerationCard } from './GenerationCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';

// ── Types ──

interface Album {
  id: string;
  name: string;
  snapType: string | null;
  images: AlbumImage[];
  groups: AlbumGroup[];
  status: string;
  generations: Generation[];
}

interface Generation {
  id: string;
  style: string;
  role: string | null;
  generatedUrls: string[] | null;
  isFavorited?: boolean;
  createdAt: string;
}

interface RoleState {
  image: File | null;
  style: AIStyle | null;
  generating: boolean;
  streamingUrls: (string | null)[];
  statusMessage: string;
  resultId: string | null;
  resultUrls: string[];
  selectedUrls: string[];
  error: string | null;
}

const initialRoleState: RoleState = {
  image: null,
  style: null,
  generating: false,
  streamingUrls: [null, null],
  statusMessage: '',
  resultId: null,
  resultUrls: [],
  selectedUrls: [],
  error: null,
};

interface AlbumDashboardProps {
  album: Album;
  credits: number;
  selectedModel: string;
  groomImage: File | null;
  brideImage: File | null;
  onGroomImageChange: (file: File | null) => void;
  onBrideImageChange: (file: File | null) => void;
  onCreditsChange: (credits: number) => void;
  onRefreshAlbum: () => void;
  onShowApplyModal: () => void;
}

export function AlbumDashboard({
  album,
  credits,
  selectedModel,
  groomImage,
  brideImage,
  onGroomImageChange,
  onBrideImageChange,
  onCreditsChange,
  onRefreshAlbum,
  onShowApplyModal,
}: AlbumDashboardProps) {
  // ── State ──
  const [groom, setGroom] = useState<RoleState>({ ...initialRoleState, image: groomImage });
  const [bride, setBride] = useState<RoleState>({ ...initialRoleState, image: brideImage });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(album.name);
  const [showGenerate, setShowGenerate] = useState(false);
  const [curatedImages, setCuratedImages] = useState<AlbumImage[]>(album.images ?? []);
  const [groups, setGroups] = useState<AlbumGroup[]>(album.groups ?? []);
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyGenerations, setLegacyGenerations] = useState<Generation[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [savingCuration, setSavingCuration] = useState<'idle' | 'saving' | 'done'>('idle');
  const [saveAction, setSaveAction] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [tagEditingUrl, setTagEditingUrl] = useState<string | null>(null);

  // 그룹 추가 UI
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string | null>(null);
  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm: onConfirm, handleCancel: onCancel } = useConfirm();

  const IS_DEV = process.env.NODE_ENV === 'development';
  const snapType = album.snapType as SnapType | null;
  const anyGenerating = groom.generating || bride.generating;

  // Sync groom/bride images from parent
  useEffect(() => {
    setGroom((prev) => ({ ...prev, image: groomImage }));
  }, [groomImage]);
  useEffect(() => {
    setBride((prev) => ({ ...prev, image: brideImage }));
  }, [brideImage]);

  // Sync album data when album prop changes
  useEffect(() => {
    setCuratedImages(album.images ?? []);
    setGroups(album.groups ?? []);
    setNameInput(album.name);
  }, [album.id, album.images, album.groups, album.name]);

  // ── 앨범 이름 수정 ──
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      await fetch(`/api/ai/albums/${album.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      setEditingName(false);
      onRefreshAlbum();
    } catch {
      // 실패 시 무시
    }
  };

  // ── 큐레이션 저장 (images + groups) ──
  const saveCuration = useCallback(async (images: AlbumImage[], grps?: AlbumGroup[], action?: string) => {
    setSaveAction(action ?? '저장');
    setSavingCuration('saving');
    try {
      const body: Record<string, unknown> = { images };
      if (grps !== undefined) body.groups = grps;
      await fetch(`/api/ai/albums/${album.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSavingCuration('done');
      setTimeout(() => setSavingCuration('idle'), 1500);
    } catch {
      setSavingCuration('idle');
    }
  }, [album.id]);

  const handleCurationChange = useCallback((images: AlbumImage[], action?: string) => {
    setCuratedImages(images);
    saveCuration(images, groups, action ?? '수정');
  }, [saveCuration, groups]);

  // ── 그룹 관리 ──
  const handleAddGroup = useCallback(() => {
    if (!newGroupName.trim()) return;
    const newGroup: AlbumGroup = {
      id: createId(),
      name: newGroupName.trim(),
      sortOrder: groups.length,
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    setNewGroupName('');
    setShowGroupInput(false);
    saveCuration(curatedImages, updated, '그룹 추가');
  }, [newGroupName, groups, curatedImages, saveCuration]);

  const handleRenameGroup = useCallback((groupId: string, name: string) => {
    const updated = groups.map((g) => g.id === groupId ? { ...g, name } : g);
    setGroups(updated);
    saveCuration(curatedImages, updated, '그룹 수정');
  }, [groups, curatedImages, saveCuration]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.isDefault) return;

    const imagesInGroup = curatedImages.filter((img) => img.groupId === groupId);
    const confirmed = await confirm({
      title: `"${group.name}" 그룹을 삭제하시겠습니까?`,
      description: imagesInGroup.length > 0
        ? `그룹 내 ${imagesInGroup.length}장의 사진은 미분류로 이동됩니다.`
        : '빈 그룹이 삭제됩니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'warning',
    });

    if (!confirmed) return;

    const updated = groups
      .filter((g) => g.id !== groupId)
      .map((g, i) => ({ ...g, sortOrder: i }));
    const updatedImages = curatedImages.map((img) =>
      img.groupId === groupId ? { ...img, groupId: undefined } : img
    );
    setGroups(updated);
    setCuratedImages(updatedImages);
    saveCuration(updatedImages, updated, '그룹 삭제');
  }, [groups, curatedImages, saveCuration, confirm]);

  // ── 태그 관리 ──
  const handleToggleTag = useCallback((url: string, tag: string) => {
    const updated = curatedImages.map((img) => {
      if (img.url !== url) return img;
      const tags = img.tags ?? [];
      const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
      return { ...img, tags: newTags };
    });
    setCuratedImages(updated);
    saveCuration(updated, groups, '태그 수정');
  }, [curatedImages, groups, saveCuration]);

  const handleAddCustomTag = useCallback((url: string, tag: string) => {
    if (!tag.trim()) return;
    const trimmed = tag.trim().slice(0, 30);
    const updated = curatedImages.map((img) => {
      if (img.url !== url) return img;
      const tags = img.tags ?? [];
      if (tags.includes(trimmed) || tags.length >= 10) return img;
      return { ...img, tags: [...tags, trimmed] };
    });
    setCuratedImages(updated);
    saveCuration(updated, groups, '태그 추가');
  }, [curatedImages, groups, saveCuration]);

  // ── 이미지 큐레이션 토글 ──
  const handleToggleImageInAlbum = useCallback((gen: Generation, url: string) => {
    const exists = curatedImages.some((img) => img.url === url);
    let updated: AlbumImage[];

    if (exists) {
      updated = curatedImages
        .filter((img) => img.url !== url)
        .map((img, i) => ({ ...img, sortOrder: i }));
    } else {
      const newImg: AlbumImage = {
        url,
        generationId: gen.id,
        style: gen.style as AIStyle,
        role: (gen.role ?? 'GROOM') as PersonRole,
        sortOrder: curatedImages.length,
      };
      updated = [...curatedImages, newImg];
    }

    setCuratedImages(updated);
    saveCuration(updated, groups, exists ? '사진 삭제' : '사진 추가');
  }, [curatedImages, groups, saveCuration]);

  // ── SSE 생성 ──
  const handleGenerate = useCallback(async (role: PersonRole) => {
    const state = role === 'GROOM' ? groom : bride;
    const update = role === 'GROOM' ? setGroom : setBride;

    if (!state.image || !state.style) return;
    if (!IS_DEV && credits === 0) {
      update((prev) => ({ ...prev, error: '크레딧이 부족합니다.' }));
      return;
    }

    update((prev) => ({
      ...prev,
      generating: true,
      error: null,
      streamingUrls: [null, null],
      statusMessage: '준비 중...',
      resultId: null,
      resultUrls: [],
      selectedUrls: [],
    }));

    try {
      const formData = new FormData();
      formData.append('image', state.image);
      formData.append('style', state.style);
      formData.append('role', role);
      formData.append('modelId', selectedModel);
      formData.append('albumId', album.id);

      const res = await fetch('/api/ai/generate/stream', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) throw new Error('크레딧이 부족합니다');
        if (res.status === 400) throw new Error(errorData.error || '얼굴을 감지할 수 없습니다');
        if (res.status === 429) throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요');
        throw new Error(errorData.error || '스트리밍 연결 실패');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case 'status':
                update((prev) => ({ ...prev, statusMessage: data.message }));
                break;
              case 'image':
                update((prev) => {
                  const next = [...prev.streamingUrls];
                  next[data.index] = data.url;
                  return { ...prev, streamingUrls: next, statusMessage: `${data.progress}/${data.total}장 생성 완료` };
                });
                break;
              case 'done':
                update((prev) => ({
                  ...prev,
                  generating: false,
                  resultId: data.id,
                  resultUrls: data.generatedUrls,
                }));
                onCreditsChange(data.remainingCredits);
                onRefreshAlbum();
                break;
              case 'error':
                throw new Error(data.error);
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch (err) {
      update((prev) => ({
        ...prev,
        generating: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다',
      }));
    }
  }, [groom, bride, credits, selectedModel, album.id, IS_DEV, onCreditsChange, onRefreshAlbum]);

  const handleRegenerate = async (role: PersonRole) => {
    const update = role === 'GROOM' ? setGroom : setBride;
    update((prev) => ({ ...prev, resultId: null, resultUrls: [], selectedUrls: [] }));
    await handleGenerate(role);
  };

  const handleToggleImage = (role: PersonRole, url: string) => {
    const update = role === 'GROOM' ? setGroom : setBride;
    update((prev) => {
      const selected = prev.selectedUrls.includes(url)
        ? prev.selectedUrls.filter((u) => u !== url)
        : [...prev.selectedUrls, url];
      return { ...prev, selectedUrls: selected };
    });
  };

  // ── 레거시 기록 로드 ──
  const loadLegacy = async () => {
    if (legacyGenerations.length > 0) {
      setShowLegacy(!showLegacy);
      return;
    }
    setLegacyLoading(true);
    try {
      const res = await fetch('/api/ai/generations?noAlbum=true&limit=50');
      const data = await res.json();
      if (data.success) {
        setLegacyGenerations(data.data);
      }
    } catch {
      // 실패 시 무시
    } finally {
      setLegacyLoading(false);
      setShowLegacy(true);
    }
  };

  // ── 레거시 이미지를 앨범에 추가 ──
  const handleAddLegacyToAlbum = async (gen: Generation) => {
    if (!gen.generatedUrls?.length) return;

    try {
      await fetch(`/api/ai/generations/${gen.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: album.id }),
      });

      setLegacyGenerations((prev) => prev.filter((g) => g.id !== gen.id));
      onRefreshAlbum();
    } catch {
      // 실패 시 무시
    }
  };

  // ── 스타일별 그룹핑 ──
  const generationsByStyle = album.generations.reduce((acc, gen) => {
    const key = gen.style;
    if (!acc[key]) acc[key] = [];
    acc[key].push(gen);
    return acc;
  }, {} as Record<string, Generation[]>);

  const snapTypeInfo = SNAP_TYPES.find((t) => t.value === snapType);
  const curatedCount = curatedImages.length;
  const totalGenerated = album.generations.reduce(
    (sum, g) => sum + (g.generatedUrls?.length ?? 0),
    0
  );

  // 태그 모음 (필터용)
  const allTags = Array.from(
    new Set(curatedImages.flatMap((img) => img.tags ?? []))
  );

  return (
    <div className="space-y-8">
      {/* ── 앨범 헤더 ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {/* 앨범 이름 */}
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="rounded-lg border border-stone-200 px-3 py-1 text-lg font-semibold text-stone-900 focus:border-rose-400 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                />
                <button onClick={handleSaveName} className="text-rose-500 hover:text-rose-600">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-stone-900">{album.name}</h2>
                <button
                  onClick={() => { setNameInput(album.name); setEditingName(true); }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* 메타 */}
          <div className="flex items-center gap-3 text-xs text-stone-500">
            {snapTypeInfo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 font-medium text-stone-600">
                <Camera className="w-3 h-3" />
                {snapTypeInfo.label}
              </span>
            )}
            <span>{totalGenerated}장 생성</span>
            <span>{curatedCount}장 선택</span>
            {groups.length > 0 && <span>{groups.length}개 그룹</span>}
            {savingCuration === 'saving' && (
              <span className="text-rose-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> {saveAction} 중...
              </span>
            )}
            {savingCuration === 'done' && (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> {saveAction} 완료!
              </span>
            )}
          </div>
        </div>

        {/* 적용 버튼 */}
        {curatedCount > 0 && (
          <button
            onClick={onShowApplyModal}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            <Sparkles className="w-4 h-4" />
            청첩장에 적용
          </button>
        )}
      </div>

      {/* ── 그룹 관리 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-800">그룹</h3>
          {!showGroupInput && (
            <button
              onClick={() => setShowGroupInput(true)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-rose-600 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              그룹 추가
            </button>
          )}
        </div>

        {showGroupInput && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="그룹 이름 (예: 스튜디오 베스트)"
              className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700 focus:border-rose-400 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGroup();
                if (e.key === 'Escape') { setShowGroupInput(false); setNewGroupName(''); }
              }}
            />
            <button onClick={handleAddGroup} disabled={!newGroupName.trim()} className="text-rose-500 hover:text-rose-600 disabled:text-stone-300">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowGroupInput(false); setNewGroupName(''); }} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGroupFilter(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                activeGroupFilter === null ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              전체
            </button>
            {groups.map((g) => (
              <GroupChip
                key={g.id}
                group={g}
                isActive={activeGroupFilter === g.id}
                onSelect={(id) => setActiveGroupFilter(activeGroupFilter === id ? null : id)}
                onRename={handleRenameGroup}
                onDelete={handleDeleteGroup}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 태그 필터 ── */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-xs font-medium text-stone-500">태그 필터</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTagFilter === null ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              전체
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTagFilter === tag ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 큐레이션 섹션 ── */}
      <AlbumCuration
        images={curatedImages}
        groups={groups}
        activeGroupFilter={activeGroupFilter}
        activeTagFilter={activeTagFilter}
        tagEditingUrl={tagEditingUrl}
        onTagEditRequest={setTagEditingUrl}
        onToggleTag={handleToggleTag}
        onAddCustomTag={handleAddCustomTag}
        onImagesChange={handleCurationChange}
      />

      {/* ── 생성된 사진 (스타일별 그룹) ── */}
      {Object.keys(generationsByStyle).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-stone-800">생성된 사진</h3>

          {Object.entries(generationsByStyle).map(([style, gens]) => {
            const styleInfo = AI_STYLES.find((s) => s.value === style);

            return (
              <div key={style} className="space-y-3">
                <p className="text-xs font-medium text-stone-500">
                  {styleInfo?.label ?? style} ({gens.reduce((s, g) => s + (g.generatedUrls?.length ?? 0), 0)}장)
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {gens.flatMap((gen) =>
                    (gen.generatedUrls ?? []).map((url) => {
                      const isInAlbum = curatedImages.some((img) => img.url === url);

                      return (
                        <div
                          key={url}
                          onClick={() => handleToggleImageInAlbum(gen, url)}
                          className={`
                            group relative aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all
                            ${isInAlbum ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-stone-200 hover:border-stone-300'}
                          `}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          {isInAlbum && (
                            <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                              <div className="rounded-full bg-rose-500 p-1">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 추가 촬영 ── */}
      <div className="space-y-4">
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-rose-300 hover:text-rose-600 w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          추가 촬영
          {showGenerate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGenerate && (
          <div className="space-y-6 rounded-xl border border-stone-200 bg-stone-50 p-6">
            {/* 사진 업로드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AIPhotoUploader
                role="GROOM"
                image={groom.image}
                onImageChange={onGroomImageChange}
                disabled={anyGenerating}
              />
              <AIPhotoUploader
                role="BRIDE"
                image={bride.image}
                onImageChange={onBrideImageChange}
                disabled={anyGenerating}
              />
            </div>

            {/* 스타일 선택 + 생성 (역할별) */}
            {['GROOM', 'BRIDE'].map((r) => {
              const role = r as PersonRole;
              const state = role === 'GROOM' ? groom : bride;
              const update = role === 'GROOM' ? setGroom : setBride;
              const roleLabel = role === 'GROOM' ? '신랑' : '신부';

              if (!state.image) return null;

              // 생성 중
              if (state.generating) {
                return (
                  <div key={role}>
                    <AIStreamingGallery
                      role={role}
                      images={state.streamingUrls}
                      statusMessage={state.statusMessage}
                      originalImage={state.image}
                    />
                  </div>
                );
              }

              // 결과 있음
              if (state.resultUrls.length > 0) {
                return (
                  <div key={role}>
                    <AIResultGallery
                      role={role}
                      images={state.resultUrls}
                      selectedImages={state.selectedUrls}
                      onToggleImage={(url) => handleToggleImage(role, url)}
                      onRegenerate={() => handleRegenerate(role)}
                      remainingCredits={credits}
                      disabled={anyGenerating}
                    />
                  </div>
                );
              }

              // 스타일 선택 + 생성 버튼
              return (
                <div key={role} className="space-y-4">
                  <h4 className="text-sm font-medium text-stone-700">{roleLabel} 스타일</h4>
                  <StyleSelector
                    selectedStyle={state.style}
                    onStyleSelect={(style) => update((prev) => ({ ...prev, style }))}
                    disabled={anyGenerating}
                    snapType={snapType}
                  />

                  {state.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{state.error}</div>
                  )}

                  {state.style && (
                    <button
                      onClick={() => handleGenerate(role)}
                      disabled={anyGenerating || (!IS_DEV && credits === 0)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      {roleLabel} AI 사진 생성 (1 크레딧)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 레거시 섹션 ── */}
      <div className="space-y-3">
        <button
          onClick={loadLegacy}
          disabled={legacyLoading}
          className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {legacyLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : showLegacy ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          이전 생성 기록
        </button>

        {showLegacy && legacyGenerations.length > 0 && (
          <div className="space-y-3 rounded-lg border border-stone-100 bg-stone-50 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {legacyGenerations.map((gen) => (
                <div key={gen.id} className="space-y-2">
                  <GenerationCard
                    generation={{ ...gen, isFavorited: gen.isFavorited ?? false }}
                    onToggleFavorite={() => {}}
                  />
                  <button
                    onClick={() => handleAddLegacyToAlbum(gen)}
                    className="w-full text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    앨범에 추가
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showLegacy && legacyGenerations.length === 0 && !legacyLoading && (
          <p className="text-xs text-stone-400 pl-5">이전 생성 기록이 없습니다</p>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={onCancel}
        onConfirm={onConfirm}
        title={confirmOptions.title}
        description={confirmOptions.description}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        variant={confirmOptions.variant}
      />
    </div>
  );
}

// ── Group Chip ──

function GroupChip({
  group,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  group: AlbumGroup;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-20 bg-transparent text-xs text-stone-700 focus:outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onRename(group.id, name); setEditing(false); }
            if (e.key === 'Escape') { setName(group.name); setEditing(false); }
          }}
          onBlur={() => { onRename(group.id, name); setEditing(false); }}
        />
      </div>
    );
  }

  return (
    <div
      className={`group/chip flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
        isActive ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      <button onClick={() => onSelect(group.id)} className="hover:text-stone-900">
        {group.name}
      </button>
      <div className="flex items-center gap-0.5 max-w-0 opacity-0 overflow-hidden transition-all duration-200 ease-out group-hover/chip:max-w-[3rem] group-hover/chip:opacity-100 group-hover/chip:ml-1">
        <button
          onClick={(e) => { e.stopPropagation(); setName(group.name); setEditing(true); }}
          className="text-stone-400 hover:text-stone-700"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
        {!group.isDefault && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
            className="text-stone-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
