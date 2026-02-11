'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { AIStyle, PersonRole } from '@/types/ai';
import { AIPhotoUploader } from './components/AIPhotoUploader';
import { StyleSelector } from './components/StyleSelector';
import { AIStreamingGallery } from '@/components/ai/AIStreamingGallery';
import { AIResultGallery } from '@/components/ai/AIResultGallery';
import { DEFAULT_MODEL } from '@/lib/ai/models';

const IS_DEV = process.env.NODE_ENV === 'development';

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
  streamingUrls: [null, null, null, null],
  statusMessage: '',
  resultId: null,
  resultUrls: [],
  selectedUrls: [],
  error: null,
};

interface AvailableModel {
  id: string;
  name: string;
  description: string;
  costPerImage: number;
  isRecommended: boolean;
}

export default function AIPhotosPage() {
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  const [groom, setGroom] = useState<RoleState>(initialRoleState);
  const [bride, setBride] = useState<RoleState>(initialRoleState);

  // 모델 선택
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchCredits();
    fetchModels();
  }, []);

  const fetchCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const res = await fetch('/api/user/credits');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch credits');
      setCredits(data.credits);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/ai/models');
      const data = await res.json();
      if (data.success && data.data.models.length > 0) {
        setAvailableModels(data.data.models);
        const ids = data.data.models.map((m: AvailableModel) => m.id);
        if (!ids.includes(selectedModel)) {
          setSelectedModel(data.data.defaultModel || ids[0]);
        }
      }
    } catch {
      // fetch 실패 시 기본값 유지
    }
  };

  const getState = (role: PersonRole) => (role === 'GROOM' ? groom : bride);
  const setState = (role: PersonRole) => (role === 'GROOM' ? setGroom : setBride);

  const handleGenerate = useCallback(async (role: PersonRole) => {
    const state = role === 'GROOM' ? groom : bride;
    const update = role === 'GROOM' ? setGroom : setBride;

    if (!state.image || !state.style) return;
    if (!IS_DEV && credits === 0) {
      update((prev) => ({ ...prev, error: '크레딧이 부족합니다. 추가 구매가 필요합니다.' }));
      return;
    }

    update((prev) => ({
      ...prev,
      generating: true,
      error: null,
      streamingUrls: [null, null, null, null],
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
                setCredits(data.remainingCredits);
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
  }, [groom, bride, credits, selectedModel]);

  const handleRegenerate = async (role: PersonRole) => {
    const update = setState(role);
    update((prev) => ({ ...prev, resultId: null, resultUrls: [], selectedUrls: [] }));
    await handleGenerate(role);
  };

  const handleToggleImage = (role: PersonRole, url: string) => {
    const update = setState(role);
    update((prev) => {
      const selected = prev.selectedUrls.includes(url)
        ? prev.selectedUrls.filter((u) => u !== url)
        : [...prev.selectedUrls, url];
      return { ...prev, selectedUrls: selected };
    });
  };

  const allSelected = [...groom.selectedUrls, ...bride.selectedUrls];
  const canApply = allSelected.length > 0;
  const anyGenerating = groom.generating || bride.generating;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" />
          <h1 className="text-lg font-semibold text-stone-900">AI 포토 스튜디오</h1>
        </div>
        <p className="text-sm text-stone-500">
          증명 사진으로 웨딩 화보를 만들어보세요. 스타일을 선택하고 4장의 AI 사진을 생성합니다.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">잔여 크레딧:</span>
          {isLoadingCredits ? (
            <span className="text-sm text-stone-400">로딩 중...</span>
          ) : IS_DEV ? (
            <span className="text-sm font-semibold text-green-600">무제한 (DEV)</span>
          ) : (
            <span className="text-sm font-semibold text-stone-900">{credits}회</span>
          )}
        </div>
      </div>

      {/* 고급 설정 (모델 선택) */}
      {availableModels.length > 1 && (
        <div className="rounded-lg border border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span>고급 설정</span>
              <span className="text-xs text-stone-400">
                ({availableModels.find((m) => m.id === selectedModel)?.name})
              </span>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="border-t border-stone-100 px-5 py-4 space-y-2">
              <p className="text-xs text-stone-500">AI 모델 선택</p>
              <div className="space-y-1.5">
                {availableModels.map((model) => (
                  <label
                    key={model.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedModel === model.id
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-stone-200 hover:border-stone-300'
                    } ${anyGenerating ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={selectedModel === model.id}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-stone-700">{model.name}</span>
                        {model.isRecommended && (
                          <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded">추천</span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">{model.description}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedModel === model.id ? 'border-rose-500' : 'border-stone-300'
                      }`}
                    >
                      {selectedModel === model.id && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Groom Section */}
      <PersonSection
        role="GROOM"
        state={groom}
        onImageChange={(file) => setGroom((prev) => ({ ...prev, image: file }))}
        onStyleSelect={(style) => setGroom((prev) => ({ ...prev, style }))}
        onGenerate={() => handleGenerate('GROOM')}
        onRegenerate={() => handleRegenerate('GROOM')}
        onToggleImage={(url) => handleToggleImage('GROOM', url)}
        credits={credits}
        anyGenerating={anyGenerating}
      />

      {/* Bride Section */}
      <PersonSection
        role="BRIDE"
        state={bride}
        onImageChange={(file) => setBride((prev) => ({ ...prev, image: file }))}
        onStyleSelect={(style) => setBride((prev) => ({ ...prev, style }))}
        onGenerate={() => handleGenerate('BRIDE')}
        onRegenerate={() => handleRegenerate('BRIDE')}
        onToggleImage={(url) => handleToggleImage('BRIDE', url)}
        credits={credits}
        anyGenerating={anyGenerating}
      />

      {/* 선택된 사진 요약 + 적용 버튼 */}
      {canApply && (
        <div className="sticky bottom-6 z-10">
          <div className="mx-auto max-w-md rounded-xl border border-rose-200 bg-white px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">
                {allSelected.length}장 선택됨
              </span>
              <button
                onClick={() => {
                  // TODO: cuggu-abb에서 구현
                  alert(`선택된 사진 ${allSelected.length}장\n\n청첩장 적용 기능은 다음 단계에서 구현됩니다.`);
                }}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
              >
                <Sparkles className="w-4 h-4" />
                청첩장에 적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PersonSection ---

interface PersonSectionProps {
  role: PersonRole;
  state: RoleState;
  onImageChange: (file: File | null) => void;
  onStyleSelect: (style: AIStyle) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onToggleImage: (url: string) => void;
  credits: number;
  anyGenerating: boolean;
}

function PersonSection({
  role,
  state,
  onImageChange,
  onStyleSelect,
  onGenerate,
  onRegenerate,
  onToggleImage,
  credits,
  anyGenerating,
}: PersonSectionProps) {
  const roleLabel = role === 'GROOM' ? '신랑' : '신부';
  const canGenerate = state.image && state.style && !state.generating && state.resultUrls.length === 0;

  // 생성 중 (스트리밍)
  if (state.generating) {
    return (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-800">{roleLabel}</h2>
        <AIStreamingGallery
          role={role}
          images={state.streamingUrls}
          statusMessage={state.statusMessage}
          originalImage={state.image}
        />
      </section>
    );
  }

  // 결과 있음
  if (state.resultUrls.length > 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-800">{roleLabel}</h2>
        <AIResultGallery
          role={role}
          images={state.resultUrls}
          selectedImages={state.selectedUrls}
          onToggleImage={onToggleImage}
          onRegenerate={onRegenerate}
          remainingCredits={credits}
          disabled={anyGenerating}
        />
      </section>
    );
  }

  // 업로드 & 스타일 선택
  return (
    <section className="space-y-6 rounded-lg border border-stone-200 bg-stone-50 p-6">
      <AIPhotoUploader
        role={role}
        image={state.image}
        onImageChange={onImageChange}
        disabled={anyGenerating}
      />

      {state.image && (
        <StyleSelector
          selectedStyle={state.style}
          onStyleSelect={onStyleSelect}
          disabled={anyGenerating}
        />
      )}

      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {state.error}
        </div>
      )}

      {canGenerate && (
        <button
          onClick={onGenerate}
          disabled={anyGenerating || (!IS_DEV && credits === 0)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {roleLabel} AI 사진 생성 (1 크레딧)
        </button>
      )}

      {!IS_DEV && credits === 0 && state.image && state.style && (
        <p className="text-xs text-amber-600 text-center">
          크레딧이 부족합니다. 크레딧을 충전해주세요.
        </p>
      )}
    </section>
  );
}
